// src/app/dialogs/dialog-assistant/xml/xml-generator.service.ts
import { Injectable } from '@angular/core';
import { XmlMsg } from '../models/chat.models';
import { OpenAiProxyService } from '../service/openai-proxy.service';

type GenResult = { text: string; tokens?: number };

@Injectable({ providedIn: 'root' })
export class XmlGeneratorService {
    // ===== Tuning & limits =====
    private readonly MAX_TECH_LEN = 12_000;          // chars after compression
    private readonly MAX_PROMPT_CHARS = 16_000;      // final system+user cap (trim user if needed)
    private readonly RETRY_DELAYS = [0, 800, 1600];  // ms (3 attempts total)
    private readonly ERROR_DUMP_LIMIT = 200_000;

    // Per-section output caps (kratšie, aby proxy netrpelo)
    private readonly MAX_OUTPUT_TOKENS_HEADER = 500;   // children only
    private readonly MAX_OUTPUT_TOKENS_SECTION = 900;

    constructor(private readonly openai: OpenAiProxyService) {}

    // ========= PUBLIC API =========
    /** Generate Petriflow XML from TECH (TagSpec) in CHUNKS to avoid truncation and match the XSD. */
    async generate(tech: string): Promise<XmlMsg> {
        const t0 = performance.now();
        let rawFragments: Record<string, string> = {};
        let assembled = '';

        try {
            // 1) Shrink/normalize TECH to keep proxy happy
            const compactTech = this.compactTech(tech || '');

            // 2) Generate sections (header-children → roles → data → transitions → places → arcs)
            const headerChildren = await this.genHeaderChildren(compactTech); // inner only, NO root
            const roles = await this.genRoles(compactTech);
            const data = await this.genData(compactTech);

            // transitions/places/arcs môžu byť veľké → chunking
            const transitions = await this.genTransitionsChunked(compactTech, 24);
            const places = await this.genPlacesChunked(compactTech, 64);
            const arcs = await this.genArcsChunked(compactTech, 96);

            rawFragments = { headerChildren, roles, data, transitions, places, arcs };

            // 3) Wrap header children into proper <document> root (defensive even if already wrapped)
            const headerDoc = this.ensureDocumentWrapped(headerChildren);

            // 4) Lokalna skladacka do <document> (bez LLM)
            assembled = this.assembleDocument(headerDoc, { roles, data, transitions, places, arcs });

            // 5) Rýchla shape kontrola + heuristika
            this.assertLooksLikePetriflow(assembled);

            const msg: XmlMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'xml',
                xml: assembled,
                content: assembled,
                tokens: undefined,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0),
            };
            return msg;
        } catch (e: any) {
            const base = this.extractErr(e) || e?.message || 'Unknown error';
            const frDump = this.capDump(JSON.stringify(rawFragments, null, 2));
            const xmlDump = this.capDump(assembled);
            const enriched = [
                base,
                frDump ? `\n--- BEGIN FRAGMENTS ---\n${frDump}\n--- END FRAGMENTS ---` : '',
                xmlDump ? `\n--- BEGIN ASSEMBLED ---\n${xmlDump}\n--- END ASSEMBLED ---` : '',
            ].join('');
            throw new Error(`Failed to generate XML (chunked). ${enriched}`);
        }
    }

    // ========= SECTION PROMPTS (XSD-aligned, bez wrapperov) =========
    // Header: ask ONLY for children, NOT the root <document>
    private readonly SYS_HEADER_CHILDREN = `
Output ONLY the Petriflow <document> header CHILDREN (no root element).
Emit these, in order:
  <id>, optional <version>, <initials>, <title>, optional <icon>,
  optional <defaultRole>, <anonymousRole>, <transitionRole>.
Constraints:
- <id> must be snake_case.
- <initials> must be exactly 3 uppercase letters.
- No <role>/<data>/<transition>/<place>/<arc>.
Return ONLY those elements, nothing else.
`.trim();

    private readonly SYS_ROLES = `
Output ONLY repeated <role> elements (no wrappers).
For each role:
<role><id>snake_case_id</id><title>Human Title</title></role>
Return NOTHING ELSE.
`.trim();

    private readonly SYS_DATA = `
Output ONLY repeated <data> elements (no wrappers).
<data type="number|text|stringCollection|enumeration|enumeration_map|multichoice|multichoice_map|boolean|date|file|fileList|user|userList|dateTime|button|taskRef|caseRef|filter|i18n">
  <id>snake_case_id</id>
  <title>Human Title</title>
  <!-- optional: placeholder|desc|(values|options)|(valid|validations)|(init|inits)|format|view|component|encryption|(action|event)|actionRef*|documentRef|storage|remote|length|allowedNets -->
</data>
Return NOTHING ELSE.
`.trim();

    private readonly SYS_TRANSITIONS = `
Output ONLY repeated <transition> elements (no wrappers).
Required order: <id>, <x>, <y>, <label>, optional nodes, any number of <roleRef>, (usersRef|userRef)?, <assignedUser>?,
then repeated <dataRef>, repeated <dataGroup>, repeated <event>.
Use nested roleRef ONLY:
<roleRef><id>snake_case_role_id</id><logic><perform>true</perform></logic></roleRef>
In dataGroup use layout/grid as needed. IDs in <id> MUST be snake_case.
Return NOTHING ELSE.
`.trim();

    private readonly SYS_PLACES = `
Output ONLY repeated <place> elements (no wrappers).
<place>
  <id>snake_case_place_id</id><x>INT</x><y>INT</y><label>Human</label><tokens>0|1</tokens><static>true|false</static>
</place>
(or <isStatic> instead of <static>). Return NOTHING ELSE.
`.trim();

    private readonly SYS_ARCS = `
Output ONLY repeated <arc> elements (no wrappers).
<arc>
  <id>snake_case_arc_id</id>
  <type>regular|reset|inhibitor|read|variable</type>
  <sourceId>place_or_transition_id</sourceId>
  <destinationId>transition_or_place_id</destinationId>
  <multiplicity>1</multiplicity>
</arc>
Return NOTHING ELSE.
`.trim();

    // ========= GENERATION HELPERS =========
    /** Ask the model for header CHILDREN only; we wrap them into a proper <document> locally. */
    private async genHeaderChildren(compactTech: string): Promise<string> {
        const user = this.mkUser('HEADER children from TECH (TagSpec) — no root, ONLY children in order:', compactTech, true);
        const { text } = await this.generateWithRetry({
            system: this.SYS_HEADER_CHILDREN,
            user,
            maxOutputTokens: this.MAX_OUTPUT_TOKENS_HEADER,
        });
        const inner = (text ?? '')
            .replace(/^\s*```[\w-]*\s*/i, '')
            .replace(/```[\s\S]*$/m, '')
            .trim();

        if (!inner) throw new Error('Empty header children.');
        if (!/<id>[\s\S]*<\/id>/i.test(inner) || !/<title>[\s\S]*<\/title>/i.test(inner)) {
            throw new Error('Header children missing <id> and/or <title>.');
        }
        if (/(<role>|<data\b|<transition>|<place>|<arc>)/i.test(inner)) {
            throw new Error('Header children must NOT include role/data/transition/place/arc.');
        }
        return inner;
    }

    private async genRoles(compactTech: string): Promise<string> {
        const user = this.mkUser('ROLES from TECH (TagSpec) → output ONLY <role>…</role> list:', compactTech);
        const { text } = await this.generateWithRetry({
            system: this.SYS_ROLES,
            user,
            maxOutputTokens: this.MAX_OUTPUT_TOKENS_SECTION,
        });
        const out = (text ?? '').trim();
        if (!/<role>[\s\S]*<\/role>/i.test(out)) return ''; // povolené 0 rolí
        if (/<document\b|<data\b|<transition>|<place>|<arc>|<roles\b/i.test(out)) {
            throw new Error('Roles section contains disallowed elements or wrappers.');
        }
        return out;
    }

    private async genData(compactTech: string): Promise<string> {
        const user = this.mkUser('DATA from TECH (TagSpec) → output ONLY <data>…</data> list:', compactTech);
        const { text } = await this.generateWithRetry({
            system: this.SYS_DATA,
            user,
            maxOutputTokens: this.MAX_OUTPUT_TOKENS_SECTION,
        });
        const out = (text ?? '').trim();
        if (!/<data\b[^>]*type=/i.test(out)) return ''; // povolené 0 dát
        if (/<document\b|<role>|<transition>|<place>|<arc>|<data\s*>/i.test(out)) {
            throw new Error('Data section contains disallowed elements or empty <data> wrapper.');
        }
        return out;
    }

    private async genTransitionsChunked(compactTech: string, chunkSize: number): Promise<string> {
        const items = await this.genChunked(
            compactTech,
            this.SYS_TRANSITIONS,
            'TRANSITIONS',
            chunkSize,
            /<transition>[\s\S]*?<\/transition>/gi,
            /<transition>/i
        );
        return items.join('\n');
    }

    private async genPlacesChunked(compactTech: string, chunkSize: number): Promise<string> {
        const items = await this.genChunked(
            compactTech,
            this.SYS_PLACES,
            'PLACES',
            chunkSize,
            /<place>[\s\S]*?<\/place>/gi,
            /<place>/i
        );
        return items.join('\n');
    }

    private async genArcsChunked(compactTech: string, chunkSize: number): Promise<string> {
        const items = await this.genChunked(
            compactTech,
            this.SYS_ARCS,
            'ARCS',
            chunkSize,
            /<arc>[\s\S]*?<\/arc>/gi,
            /<arc>/i
        );
        return items.join('\n');
    }

    /**
     * Reusable chunker for large repeated sections (transitions/places/arcs).
     * TECH môže obsahovať veľa položiek; LLM pošleme inštrukciu “vyprodukuj časť N..M”.
     */
    private async genChunked(
        compactTech: string,
        system: string,
        label: 'TRANSITIONS' | 'PLACES' | 'ARCS',
        chunkSize: number,
        extractRe: RegExp,
        mustContainRe: RegExp
    ): Promise<string[]> {
        const userIntro = this.mkUser(`${label} from TECH (TagSpec) → output ONLY elements for this chunk.`, compactTech);
        const chunks: string[] = [];
        let offset = 0;
        let guard = 0;

        while (guard++ < 12) { // hard safety to avoid infinite loops
            const user = `${userIntro}\nCHUNK_INSTRUCTION: emit items ${offset + 1}..${offset + chunkSize} only (skip previous ones).`;
            const { text } = await this.generateWithRetry({
                system,
                user,
                maxOutputTokens: this.MAX_OUTPUT_TOKENS_SECTION,
            });
            const out = (text ?? '').trim();
            if (!mustContainRe.test(out)) break;

            const found = out.match(extractRe) ?? [];
            if (!found.length) break;

            chunks.push(found.join('\n'));
            offset += found.length;

            if (found.length < chunkSize) break; // last chunk
        }

        return chunks;
    }

    // ========= ASSEMBLY =========
    private assembleDocument(
        headerDoc: string,
        sections: { roles?: string; data?: string; transitions: string; places?: string; arcs?: string; }
    ): string {
        // Ensure headerDoc is a full document (defensive; we already wrap)
        const doc = this.ensureDocumentWrapped(headerDoc);

        const openMatch = doc.match(/^(\s*<document[^>]*>)/i);
        const closeMatch = doc.match(/(<\/document>\s*)$/i);

        if (!openMatch || !closeMatch) {
            throw new Error('Header could not be wrapped into a Petriflow <document> root.');
        }

        const open = openMatch[1];
        const close = closeMatch[1];
        const headerInner = this.stripOuter(doc, 'document');

        // XSD order subset: headerInner → role* → data* → transition+ → place* → arc*
        const parts = [
            headerInner,
            (sections.roles || '').trim(),
            (sections.data || '').trim(),
            sections.transitions.trim(),
            (sections.places || '').trim(),
            (sections.arcs || '').trim(),
        ].filter(Boolean);

        const xml = `${open}\n${parts.join('\n\n')}\n${close}`;
        return this.sanitizeModelXml(xml);
    }

    private stripOuter(xml: string, tag: string): string {
        const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const m = xml.match(re);
        return m ? m[1].trim() : '';
    }

    /** True if the string already looks like a Petriflow <document> */
    private hasDocumentRoot(s: string): boolean {
        return /<document\b[^>]*>[\s\S]*<\/document>\s*$/i.test(s || '');
    }

    /** Wrap raw header children into a proper Petriflow <document> root */
    private wrapHeaderChildren(childrenXml: string): string {
        const inner = (childrenXml || '').trim();
        if (!inner) throw new Error('Header children are empty.');
        // Must have at least <id> and <title>
        if (!/<id>[\s\S]*<\/id>/i.test(inner) || !/<title>[\s\S]*<\/title>/i.test(inner)) {
            throw new Error('Header children missing <id> and/or <title>.');
        }
        return (
            `<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
            `          xsi:noNamespaceSchemaLocation="https://petriflow.com/petriflow.schema.xsd">\n` +
            inner + `\n</document>`
        );
    }

    /** Ensure we always return a well-formed <document>…</document> string */
    private ensureDocumentWrapped(headerMaybeDoc: string): string {
        const s = (headerMaybeDoc || '').trim();
        if (this.hasDocumentRoot(s)) return s;
        return this.wrapHeaderChildren(s);
    }

    // ========= Proxy/retries =========
    private async generateWithRetry(payload: {
        system: string; user: string; maxOutputTokens: number;
    }): Promise<GenResult> {
        let lastErr: any = null;
        for (const delay of this.RETRY_DELAYS) {
            if (delay) await new Promise(r => setTimeout(r, delay));
            try {
                // enforce cap on final prompt
                const user = this.capUser(payload.system, payload.user);
                return await this.openai.generate({ ...payload, user });
            } catch (e: any) {
                lastErr = e;
                const status = e?.status ?? e?.code;
                const stText = (e?.statusText || '').toUpperCase();
                if ((status === 500 && stText.includes('OK')) || this.isTransient(status)) continue;
                break;
            }
        }
        const reason = this.extractErr(lastErr);
        throw new Error(reason || 'Proxy generate failed.');
    }

    private capUser(system: string, user: string): string {
        const approxSystemLen = (system || '').length;
        const allowedForUser = Math.max(2_000, this.MAX_PROMPT_CHARS - approxSystemLen);
        if (user.length > allowedForUser) {
            return user.slice(0, allowedForUser) + '\n...[truncated]';
        }
        return user;
    }

    private isTransient(status: number): boolean {
        if (!status) return true;
        if (status === 429) return true;
        return status >= 500 && status <= 599;
    }

    // ========= Heuristics & sanitation =========
    /** Fail fast if the output obviously does not match flat Petriflow shape (per XSD & example). */
    private assertLooksLikePetriflow(xml: string): void {
        const hasDoc = /<document\b[\s\S]*<\/document>/.test(xml);
        if (!hasDoc) {
            const head = xml.slice(0, 300).replace(/\s+/g, ' ');
            const tail = xml.slice(-300).replace(/\s+/g, ' ');
            throw new Error(
                `XML does not contain a Petriflow <document> root.\n` +
                `Preview(head): ${head}\nPreview(tail): ${tail}`
            );
        }
        // No grouped wrappers like <roles>, <places>, <arcs>, or empty container <data>…</data> without @type
        if (/<\s*roles\b|<\s*places\b|<\s*arcs\b|<\s*data\s*>\s*<\s*field\b/i.test(xml)) {
            throw new Error(
                'XML uses grouped wrappers (<roles>/<places>/<arcs> or <data><field/>...). ' +
                'The schema requires flat elements (<role/>, <place/>, <arc/>, <data/>).'
            );
        }
        // Must have at least one transition and proper arc shape
        if (!/<transition>\s*<id>[\s\S]*?<\/id>\s*<x>\d+<\/x>\s*<y>\d+<\/y>\s*<label>[\s\S]*?<\/label>/i.test(xml)) {
            throw new Error('Transition must include <id>, <x>, <y>, and <label>.');
        }
        if (
            !/<arc>\s*<id>[\s\S]*?<\/id>[\s\S]*?<type>[\s\S]*?<\/type>[\s\S]*?<sourceId>[\s\S]*?<\/sourceId>[\s\S]*?<destinationId>[\s\S]*?<\/destinationId>[\s\S]*?<multiplicity>[\s\S]*?<\/multiplicity>/i.test(
                xml
            )
        ) {
            throw new Error('Arc must include <multiplicity> (usually 1).');
        }
    }

    /** Strip fences/noise, keep a single Petriflow document payload. */
    private sanitizeModelXml(s: string): string {
        if (!s) return '';
        let out = s
            .replace(/^\s*```[\w-]*\s*/i, '')
            .replace(/```[\s\S]*$/m, '')
            .trim();

        const idxDoc = out.indexOf('<document');
        if (idxDoc > 0) out = out.slice(idxDoc);

        out = out.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
        return out;
    }

    /** Remove fluff & cap TECH length to reduce upstream 500s. */
    private compactTech(src: string): string {
        if (!src) return '';
        let s = src
            .replace(/\r/g, '')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n');
        if (s.length > this.MAX_TECH_LEN) {
            const head = s.slice(0, Math.floor(this.MAX_TECH_LEN * 0.6));
            const tail = s.slice(-Math.floor(this.MAX_TECH_LEN * 0.4));
            s = head + '\n...\n' + tail;
        }
        return s.trim();
    }

    private mkUser(title: string, tech: string, headerChildren = false): string {
        const rules = headerChildren ? `
Return ONLY header CHILDREN in this exact order:
<id>, optional <version>, <initials>, <title>, optional <icon>, optional <defaultRole>, <anonymousRole>, <transitionRole>.
No root element. No <role>/<data>/<transition>/<place>/<arc>.` : `
Return ONLY the requested elements for this section. No prose, no wrappers, no other elements.`;
        return [
            `${title}`,
            'TECH (TagSpec or spec-like text):',
            tech || '(empty)',
            '',
            'STRICT RULES:',
            rules,
        ].join('\n');
    }

    // ========= Misc =========
    private mkId(): string {
        try { if ((globalThis as any)?.crypto?.randomUUID) return (globalThis as any).crypto.randomUUID(); } catch {}
        return 'xml-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    private extractErr(e: any): string {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        const status = e.status ?? e.code;
        const statusText = e.statusText ?? '';
        const msg = e.message || '';
        let bodyStr = '';
        try {
            const resp = (e.error?.response ?? e.response) as any;
            if (typeof resp === 'string') bodyStr = resp;
            else if (typeof resp?.data === 'string') bodyStr = resp.data;
            else if (resp?.data && typeof resp.data === 'object') bodyStr = JSON.stringify(resp.data);
            else if (typeof e.error === 'string') bodyStr = e.error;
            else if (typeof e.error?.text === 'string') bodyStr = e.error.text;
        } catch { /* ignore */ }
        const parts = [
            status ? `HTTP ${status}` : '',
            statusText || '',
            msg || '',
            bodyStr ? `BODY: ${bodyStr.slice(0, 500)}` : '',
        ].filter(Boolean);
        return parts.join(' ');
    }

    private capDump(s: string): string {
        if (!s) return '';
        if (s.length <= this.ERROR_DUMP_LIMIT) return s;
        const head = s.slice(0, Math.floor(this.ERROR_DUMP_LIMIT * 0.6));
        const tail = s.slice(-Math.floor(this.ERROR_DUMP_LIMIT * 0.4));
        return `${head}\n...[truncated ${s.length - this.ERROR_DUMP_LIMIT} chars]...\n${tail}`;
    }
}
