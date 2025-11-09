// src/app/dialogs/dialog-assistant/xml/xml-generator.service.ts
import { Injectable } from '@angular/core';
import { XmlMsg } from '../models/chat.models';
import { OpenAiProxyService } from '../service/openai-proxy.service';

@Injectable({ providedIn: 'root' })
export class XmlGeneratorService {
    // Soft caps to avoid oversize payloads causing 500s upstream
    private readonly MAX_TECH_LEN = 12_000;          // chars after compression
    private readonly MAX_PROMPT_CHARS = 16_000;      // final system+user cap (trim user if needed)
    private readonly RETRY_DELAYS = [0, 800, 1600];  // ms (3 attempts total)

    constructor(private readonly openai: OpenAiProxyService) {}

    /** Generate Petriflow XML from TECH using `generate({system,user})`. */
    async generate(tech: string): Promise<XmlMsg> {
        const t0 = performance.now();
        try {
            // 1) Shrink/normalize TECH to keep proxy happy
            const compactTech = this.compactTech(tech || '');
            let user = ['TECH:', compactTech || '(empty)'].join('\n');

            // Hard cap the final prompt size (system+user) to protect the proxy — trim user if needed.
            const approxSystemLen = this.SYSTEM_XML_FROM_TECH.length;
            const allowedForUser = Math.max(2_000, this.MAX_PROMPT_CHARS - approxSystemLen);
            if (user.length > allowedForUser) {
                user = user.slice(0, allowedForUser) + '\n...[truncated]';
            }

            // 2) Call proxy with retries (handles 500/429 etc.)
            const { text, tokens } = await this.generateWithRetry({
                system: this.SYSTEM_XML_FROM_TECH,
                user,
                maxOutputTokens: 1600, // smaller to reduce proxy stress; was 3200
            });

            // 3) Clean + assert shape
            const raw = text ?? '';
            const xml = this.sanitizeModelXml(raw);
            this.assertLooksLikePetriflow(xml);

            const msg: XmlMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'xml',
                xml,
                content: xml,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0),
            };
            return msg;
        } catch (e: any) {
            // Surface clearer message into the chat bubble
            throw this.wrapErr(e, 'generate XML');
        }
    }

    // ===== Robust proxy call with retries =====
    private async generateWithRetry(payload: {
        system: string;
        user: string;
        maxOutputTokens: number;
    }): Promise<{ text: string; tokens?: number }> {
        let lastErr: any = null;

        for (const delay of this.RETRY_DELAYS) {
            if (delay) await new Promise(r => setTimeout(r, delay));
            try {
                return await this.openai.generate(payload);
            } catch (e: any) {
                lastErr = e;
                const status = e?.status ?? e?.code;
                const stText = (e?.statusText || '').toUpperCase();

                // Treat 429 and 5xx (including the weird "500 OK") as transient, retry.
                if ((status === 500 && stText.includes('OK')) || this.isTransient(status)) {
                    continue;
                }
                // Non-transient → bail immediately
                break;
            }
        }

        const reason = this.extractErr(lastErr);
        throw new Error(reason || 'Proxy generate failed.');
    }

    private isTransient(status: number): boolean {
        // Transient buckets: 429 (rate), 5xx (server)
        if (!status) return true;
        if (status === 429) return true;
        return status >= 500 && status <= 599;
    }

    /** Fail fast if the output is obviously not matching the flat Petriflow shape your XSD expects. */
    private assertLooksLikePetriflow(xml: string): void {
        const hasDoc = /<document\b[\s\S]*<\/document>/.test(xml);
        if (!hasDoc) {
            const preview = xml.slice(0, 300).replace(/\s+/g, ' ');
            throw new Error(`XML does not contain a Petriflow <document> root. Preview: ${preview}`);
        }

        // No grouped wrappers like <roles>, <data> (plural), <places>, <arcs>
        if (/<\s*roles\b|<\s*places\b|<\s*arcs\b|<\s*data\s*>\s*<\s*field\b/i.test(xml)) {
            throw new Error(
                'XML uses grouped wrappers (<roles>/<places>/<arcs> or <data><field/>...). ' +
                'The schema requires flat elements (<role/>, <place/>, <arc/>, <data/>).'
            );
        }

        // Role must be flat with <role><id/><title|name/></role>
        if (!/<role>\s*<id>[\s\S]*?<\/id>\s*<(title|name)>[\s\S]*?<\/\1>\s*<\/role>/i.test(xml)) {
            throw new Error('Missing flat <role> entries with <id> and <title|name>.');
        }

        // Data must be <data type="..."><id/><title/></data>
        if (!/<data\b[^>]*\btype="[^"]+"\b[^>]*>\s*<id>[\s\S]*?<\/id>\s*<title>/i.test(xml)) {
            throw new Error('Data fields must be <data type="..."><id/><title/>...</data>.');
        }

        // Transition shape: <transition><id/><x/><y/><label/>...</transition>
        if (!/<transition>\s*<id>[\s\S]*?<\/id>\s*<x>\d+<\/x>\s*<y>\d+<\/y>\s*<label>[\s\S]*?<\/label>/i.test(xml)) {
            throw new Error('Transition must include <id>, <x>, <y>, and <label>.');
        }

        // RoleRef must be nested (no roleId attribute)
        if (/<roleRef[^>]*roleId=/.test(xml)) {
            throw new Error(
                'Use nested <roleRef><id>ROLE_ID</id><logic>...</logic></roleRef>, not roleId attributes.'
            );
        }

        // Place must include <label>, <tokens>, and one of <static>/<isStatic>
        if (
            !/<place>\s*<id>[\s\S]*?<\/id>[\s\S]*?<x>\d+<\/x>[\s\S]*?<y>\d+<\/y>[\s\S]*?<label>[\s\S]*?<\/label>[\s\S]*?<tokens>\d+<\/tokens>[\s\S]*?<(static|isStatic)>(true|false)<\/\1>/i.test(
                xml
            )
        ) {
            throw new Error('Place must include <id>, <x>, <y>, <label>, <tokens>, and <static|isStatic>.');
        }

        // Arc must include <multiplicity>
        if (
            !/<arc>\s*<id>[\s\S]*?<\/id>[\s\S]*?<type>[\s\S]*?<\/type>[\s\S]*?<sourceId>[\s\S]*?<\/sourceId>[\s\S]*?<destinationId>[\s\S]*?<\/destinationId>[\s\S]*?<multiplicity>[\s\S]*?<\/multiplicity>/i.test(
                xml
            )
        ) {
            throw new Error('Arc must include <multiplicity> (usually 1).');
        }
    }

    /* ===================== Prompt ===================== */
    private readonly SYSTEM_XML_FROM_TECH = `
You are a Petriflow code generator that outputs ONLY Petriflow XML (no markdown, no prose).
You MUST follow the "flat" Petriflow layout exactly as in the examples below (this matches the XSD the app uses).

STRICT RULES (mirror the XSD + example):
- Output a single well-formed XML document.
- Root element MUST be:
  <document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:noNamespaceSchemaLocation="https://petriflow.com/petriflow.schema.xsd">
- Header order when possible:
  <id>snake_case_from_title</id>
  <initials>ABC</initials>            <!-- exactly 3 letters -->
  <title>Human Title</title>
  <icon>fa-sitemap</icon>
  <defaultRole>false</defaultRole>
  <anonymousRole>false</anonymousRole>
  <transitionRole>false</transitionRole>

- DO NOT use grouped wrappers like <roles>, <data> (plural), <places>, <arcs>. Instead use FLAT elements as direct children of <document>:
  Role(s) (repeat as needed):
    <role>
      <id>role_id</id>
      <title>Role Title</title>
    </role>

  Data field(s) (repeat as needed). Types allowed by the schema: number|text|stringCollection|enumeration|enumeration_map|multichoice|multichoice_map|boolean|date|file|fileList|user|userList|dateTime|button|taskRef|caseRef|filter|i18n
    <data type="enumeration_map">
      <id>priority</id>
      <title>Request Priority</title>
      <options>
        <option key="Low">Low</option>
        <option key="Medium">Medium</option>
        <option key="High">High</option>
      </options>
    </data>
    <!-- text field example -->
    <data type="text">
      <id>description</id>
      <title>Request Description</title>
    </data>

  Transition(s) (repeat as needed). MUST include <id>, <x>, <y>, <label>.
  Role permissions are nested with <roleRef><id>...</id><logic>...</logic></roleRef> (NO roleId attributes).
  For forms, use <dataGroup>/<dataRef> (NO <form> or <fieldRef> tags).
    <transition>
      <id>t_submit</id>
      <x>240</x>
      <y>120</y>
      <label>Submit IT Request</label>
      <roleRef>
        <id>requester</id>
        <logic><perform>true</perform></logic>
      </roleRef>
      <dataGroup>
        <id>t_submit_group</id>
        <cols>4</cols>
        <layout>grid</layout>
        <dataRef>
          <id>description</id>
          <logic><behavior>editable</behavior><behavior>required</behavior></logic>
          <layout><x>0</x><y>0</y><rows>2</rows><cols>4</cols><template>material</template><appearance>outline</appearance></layout>
        </dataRef>
        <dataRef>
          <id>priority</id>
          <logic><behavior>editable</behavior><behavior>required</behavior></logic>
        </dataRef>
      </dataGroup>
      <!-- events/actions are allowed per XSD (see example), keep concise -->
    </transition>

  Place(s) (repeat). MUST include <id>, <x>, <y>, <label>, <tokens>, and <static> (or <isStatic>).
    <place>
      <id>p_start</id>
      <x>120</x>
      <y>120</y>
      <label>Start</label>
      <tokens>1</tokens>
      <static>false</static>
    </place>

  Arc(s) (repeat). MUST include <id>, <type>, <sourceId>, <destinationId>, <multiplicity>.
    <arc>
      <id>a_start_submit</id>
      <type>regular</type>
      <sourceId>p_start</sourceId>
      <destinationId>t_submit</destinationId>
      <multiplicity>1</multiplicity>
    </arc>

- Use ONLY tags supported by the XSD and the example above.
- RoleRef is ALWAYS nested (<roleRef><id>...</id><logic>...</logic></roleRef>), never attribute-based.
- Use <dataGroup>/<dataRef> for forms; DO NOT use <form>/<fieldRef>.
- Provide at least one start place with 1 token and connect arcs correctly (place <-> transition only).
- Every arc specifies <multiplicity> (use 1 unless you need something else).

From TECH, derive:
- roles -> <role> entries (id as snake_case, title human-readable)
- fields -> <data> entries with correct type, options/validations when specified
- tasks -> <transition> with roleRef and dataGroup/dataRef for form content
- routing -> places/arcs network to reflect the sequence/branching

Return ONLY the XML.
`;

    // ===== Utils =====
    private mkId(): string {
        try {
            if (crypto?.randomUUID) return crypto.randomUUID();
        } catch {}
        return 'xml-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    private wrapErr(e: any, action: string): Error {
        const s = this.extractErr(e);
        return new Error(`Failed to ${action}. ${s}`);
    }

    private extractErr(e: any): string {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;

        const status = e.status ?? e.code;
        const statusText = e.statusText ?? '';
        const msg = e.message || '';

        // Try to show proxy response body (string or JSON)
        let bodyStr = '';
        try {
            const resp = (e.error?.response ?? e.response) as any;
            if (typeof resp === 'string') {
                bodyStr = resp;
            } else if (typeof resp?.data === 'string') {
                bodyStr = resp.data;
            } else if (resp?.data && typeof resp.data === 'object') {
                bodyStr = JSON.stringify(resp.data);
            } else if (typeof e.error === 'string') {
                bodyStr = e.error;
            } else if (typeof e.error?.text === 'string') {
                bodyStr = e.error.text;
            }
        } catch {
            /* ignore */
        }

        const parts = [
            status ? `HTTP ${status}` : '',
            statusText || '',
            msg || '',
            bodyStr ? `BODY: ${bodyStr.slice(0, 500)}` : '',
        ].filter(Boolean);

        return parts.join(' ');
    }

    /** Strip fences/noise, keep the single Petriflow document payload. */
    private sanitizeModelXml(s: string): string {
        if (!s) return '';

        // 1) Strip common markdown/code fences and language hints
        let out = s
            .replace(/^\s*```[\w-]*\s*/i, '') // opening ```[lang]
            .replace(/```[\s\S]*$/m, '')      // closing ```
            .trim();

        // 2) Cut to the start of the Petriflow document if the model prefixed anything
        const idxDoc = out.indexOf('<document');
        if (idxDoc > 0) out = out.slice(idxDoc);

        // 3) Ensure an XML declaration (optional but cleaner)
        if (!/^<\?xml\b/i.test(out)) {
            out = `<?xml version="1.0" encoding="UTF-8"?>\n` + out;
        }

        // 4) Collapse excessive blank lines
        out = out.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();

        return out;
    }

    /** Remove fluff & cap TECH length to reduce 500s from upstream. */
    private compactTech(src: string): string {
        if (!src) return '';
        let s = src
            .replace(/\r/g, '')
            .replace(/[ \t]+\n/g, '\n')  // trim EOL spaces
            .replace(/\n{3,}/g, '\n\n'); // collapse blank blocks

        if (s.length > this.MAX_TECH_LEN) {
            // Keep header sections and last chunk (often contains tasks)
            const head = s.slice(0, Math.floor(this.MAX_TECH_LEN * 0.6));
            const tail = s.slice(-Math.floor(this.MAX_TECH_LEN * 0.4));
            s = head + '\n...\n' + tail;
        }
        return s.trim();
    }
}
