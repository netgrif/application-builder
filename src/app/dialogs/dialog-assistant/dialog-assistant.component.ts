// src/app/dialogs/dialog-assistant/dialog-assistant.component.ts
import { Component, Inject, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { DatePipe, NgForOf, NgIf, NgClass } from '@angular/common';
import { ModelExportService } from '../../modeler/services/model/model-export.service';
import { ModelImportService } from '../../modeler/model-import-service';

import { OpenAiHttpService, OpenAiService, PETRIFLOW_MODELS } from './openai-http.service';
import { PetriflowExamplesService } from './petriflow-examples.service';

/** Integration stubs (replace with real app services when ready) */
export abstract class BuilderApiService {
    abstract exportFromBuilder(): Promise<string>;
    abstract importToBuilder(xml: string): Promise<void>;
}
export abstract class XmlValidationService {
    abstract validate(xml: string): Promise<void>;
}

/** Chat structures */
type MsgKind = 'user' | 'plan' | 'xml' | 'thinking' | 'info';

interface PetriflowPlan {
    roles: string[];
    data: { name: string; type: string }[];
    workflow: {
        places: string[];
        transitions: string[];
        arcs: { from: string; to: string }[];
    };
    forms: { transition: string; fields: string[] }[];
    validations: string[];
    events: string[];
    summary: string;
}

interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    kind: MsgKind;
    content: string;
    timestamp: number;
    latencyMs?: number;
    tokens?: number;
    xml?: string;
    error?: string;
    summary?: string;
    /** attached structured plan (for plan bubbles) */
    plan?: PetriflowPlan;
}

interface AssistantState {
    lastPlan?: PetriflowPlan;  // last structured plan
    lastXml?: string;          // last generated XML
}

const STORAGE_KEY = 'nab.dialog.assistant.v2';

// Heuristics / tuning
const MIN_REQUEST_LEN = 12;  // short prompts will trigger best-guess planning
const XML_RETRY_STEPS = 2;   // attempts: normal → repair/extract

@Component({
    selector: 'nab-dialog-assistant',
    templateUrl: './dialog-assistant.component.html',
    styleUrls: ['./dialog-assistant.component.scss'],
    standalone: true,
    imports: [
        FormsModule, NgIf, NgForOf, NgClass, DatePipe,
        CdkTextareaAutosize, CdkScrollable,
        MatDialogTitle, MatDialogContent, MatDialogActions,
        MatIcon, MatFormField, MatInput, MatSuffix,
        MatSelect, MatOption, MatSlideToggle,
        MatChipSet, MatChip,
        MatCard, MatCardContent,
        MatProgressBar,
        MatButton, MatIconButton,
        MatTooltip,
    ],
    providers: [
        { provide: OpenAiService, useClass: OpenAiHttpService },
        // Replace when real services are ready
        { provide: BuilderApiService, useValue: { exportFromBuilder: async () => '<document/>', importToBuilder: async (_: string) => {} } },
        { provide: XmlValidationService, useValue: { validate: async (_: string) => {} } },
    ],
})
export class DialogAssistantComponent implements OnInit {
    @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLDivElement>;
    @ViewChild('promptArea') promptArea?: ElementRef<HTMLTextAreaElement>;


    // UI state
    prompt = '';
    isLoading = false;
    messages: ChatMessage[] = [];
    private _idSeq = 0;

    // model picker (best → cheapest)
    modelOptions = PETRIFLOW_MODELS;
    selectedModel = this.modelOptions[1].id; // default: GPT-4.1-mini

    // telemetry
    tokenUsage: { total: number } | null = null;
    rateInfo: string | null = null;

    // context
    private currentXmlCache: string | null = null;
    private attachments: { name: string; text: string }[] = [];
    private state: AssistantState = {};
    private fewShotCache = '';

    constructor(
        private dialogRef: MatDialogRef<DialogAssistantComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private openai: OpenAiService,
        private builder: BuilderApiService,
        private xmlValidation: XmlValidationService,
        private modelExport: ModelExportService,
        private modelImport: ModelImportService,
        private examples: PetriflowExamplesService,
    ) {}

    async ngOnInit(): Promise<void> {
        // restore persisted chat
        this.loadFromStorage();

        // prime few-shot (mortgage + request)
        this.fewShotCache = await this.examples.getFewShot();

        // cache current XML
        try { this.currentXmlCache = this.safeExportXml(); } catch {}

        // always scroll to bottom on open
        this.scrollToBottomSoon();
    }

    // ====== Persistence ======
    private saveToStorage() {
        const payload = {
            messages: this.messages,
            state: this.state,
            selectedModel: this.selectedModel,
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
    }
    private loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            this.messages = (parsed.messages ?? []).map((m: ChatMessage) => ({ ...m }));
            this.state = parsed.state ?? {};
            this.selectedModel = parsed.selectedModel ?? this.selectedModel;
            // fix id sequence
            this._idSeq = this.messages.reduce((mx, m) => Math.max(mx, m.id), 0);
        } catch {}
    }

    // ====== Actions ======
    onClose() { this.dialogRef.close(); }

    onAttachContext() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.json,.xml';
        input.onchange = async () => {
            const f = input.files?.[0];
            if (!f) return;
            try {
                const text = await f.text();
                this.attachments.push({ name: f.name, text });
                this.toast(`Attached: ${f.name}`);
            } catch (e: any) {
                this.toast(`Attachment failed: ${e?.message || e}`);
            }
        };
        input.click();
    }

    onClear() {
        this.messages = [];
        this.state = {};
        this.saveToStorage();
    }

    trackByMsgFn = (_: number, m: ChatMessage) => m.id;

    // ====== Main flow ======
    async send() {
        const content = (this.prompt || '').trim();
        if (!content || this.isLoading) return;

        // user message
        this.pushMsg({ role: 'user', kind: 'user', content });

        // allow "yes / generate" to trigger direct XML
        const wantsGenerate = /^\s*(yes|generate|generate xml|generate source|apply plan)\b/i.test(content);

        // "thinking" placeholder
        const thinking = this.pushMsg({ role: 'assistant', kind: 'thinking', content: 'Thinking…' });

        // clear composer
        this.prompt = '';
        this.isLoading = true;
        this.scrollToBottomSoon();

        const t0 = performance.now();
        try {
            // 1) primary plan
            const planPrompt = this.buildPlanPrompt(content);
            let result = await this.openai.generate({
                system: this.systemPrompt(),
                user: planPrompt,
                model: this.selectedModel,
                maxOutputTokens: 1200,
            });

            let plan = this.tryParsePlan(result.text || '');

            // 2) fallback: if not valid JSON plan, force convert to JSON plan
            if (!plan) {
                const forcePlanPrompt =
                    `Convert the following content into the JSON plan by the schema. Return JSON only.\n\nCONTENT:\n` +
                    (result.text || '(empty)');
                result = await this.openai.generate({
                    system: this.systemPrompt(),
                    user: forcePlanPrompt,
                    model: this.selectedModel,
                    maxOutputTokens: 900,
                });
                plan = this.tryParsePlan(result.text || '');
            }

            const latency = Math.round(performance.now() - t0);
            this.tokenUsage = { total: result.tokens ?? 0 };
            this.rateInfo = result.rateInfo ?? null;

            if (plan) {
                this.mutateMsg(thinking.id, { kind: 'plan', plan, content: '', latencyMs: latency, tokens: result.tokens ?? undefined });
                this.state.lastPlan = plan;
                this.saveToStorage();
                this.scrollToBottomSoon();

                if (wantsGenerate) await this.generateXmlFromPlan({ ...thinking, plan });
            } else {
                this.mutateMsg(thinking.id, {
                    kind: 'info',
                    content: 'I could not build a structured plan from your request. Please add a bit more detail (roles, key steps), then try again.',
                    latencyMs: latency,
                    tokens: result.tokens ?? undefined
                });
            }
        } catch (e: any) {
            this.mutateMsg(thinking.id, { kind: 'info', content: 'Error while planning.', error: e?.message || String(e) });
        } finally {
            this.isLoading = false;
            this.saveToStorage();
        }
    }

    refineFromPlan(planMsg: ChatMessage) {
        // vezmeme JSON plán ak je, inak posledný
        const plan = planMsg.plan || this.state.lastPlan;
        const summary = plan?.summary || 'Refine the requirements:';
        const hint =
            `Refine:
                - Add/rename roles
                - Add fields (type: text/number/date/enum/file/boolean/user, etc.)
                - Clarify transitions and forms
                - Add validations and events`;

        // predvyplní composer tak, aby používateľ prirodzene doplnil detaily
        this.prompt = `${summary}\n\n${hint}\n\nAdd: `;
        this.scrollToBottomSoon();
        setTimeout(() => this.promptArea?.nativeElement?.focus(), 0);
    }

    async copyMsg(msg: ChatMessage) {
        try {
            let toCopy = '';
            if (msg.kind === 'xml' && msg.xml) {
                toCopy = msg.xml;
            } else if (msg.kind === 'plan' && msg.plan) {
                // máme už serializePlan v TS
                toCopy = this.serializePlan(msg.plan);
            } else {
                toCopy = msg.content || '';
            }
            await navigator.clipboard.writeText(toCopy);
            this.toast('Copied to clipboard.');
        } catch (e) {
            this.toast('Copy failed.');
        }
    }

    /** Button shown on a plan bubble */
    async generateXmlFromPlan(planMsg: ChatMessage) {
        if (this.isLoading) return;

        const plan = planMsg.plan || this.state.lastPlan;
        const planText = plan ? this.serializePlan(plan) : (planMsg.content || (this.state.lastPlan ? this.serializePlan(this.state.lastPlan!) : ''));

        const thinking = this.pushMsg({ role: 'assistant', kind: 'thinking', content: 'Generating source code…' });
        this.isLoading = true;
        this.scrollToBottomSoon();
        const t0 = performance.now();

        try {
            const currentXml = this.currentXmlCache ?? this.safeExportXml();
            const attachmentsBlock = this.attachments.length
                ? '\n' + this.attachments.map(a => `---ATTACHMENT:${a.name}---\n${a.text}\n---END_ATTACHMENT---`).join('\n')
                : '';

            // Checklist hint (optional but recommended): makes the model include full Petriflow structure.
            const checklist = [
                '- <id>, <version>, <initials>, <title>, <icon>',
                '- <role> elements for each role from the plan',
                '- <data> elements for each data field; types aligned with examples (text, number, date, enum, file, boolean, user, etc.)',
                '- <dataGroup> + <dataRef> to group fields for forms',
                '- Transitions with <roleRef perform="true"> and appropriate <dataGroup>',
                '- Petri net: connected <place> and <transition> nodes and <arc> with unique ids',
                '- Basic guards/validations consistent with the plan (e.g., required fields, positive amounts)',
                '- Preserve existing ids and apply minimal diffs if CURRENT_MODEL_XML is non-empty',
            ].join('\n');

            // Step 1: ask for RAW XML only
            const baseXmlPrompt =
                `Create a VALID Petriflow process XML using this PLAN and CURRENT MODEL.\n\n` +
                `PLAN(JSON):\n${planText}\n\n` +
                `CURRENT_MODEL_XML:\n---XML_START---\n${this.sliceMiddle(currentXml, 12000)}\n---XML_END---\n` +
                `${attachmentsBlock}\n\n` +
                `STRICT RULES:\n` +
                `- Output ONLY raw XML (no markdown, no comments, no explanations).\n` +
                `- Include the following sections:\n${checklist}\n`;

            const tryOnce = async (forceExtraction = false) => {
                const res = await this.openai.generate({
                    system: this.systemPrompt(),
                    user: forceExtraction
                        ? `Return ONLY the raw Petriflow XML from the following content. Remove any prose/markdown.\n\nCONTENT:\n${baseXmlPrompt}`
                        : baseXmlPrompt,
                    model: this.selectedModel,
                    maxOutputTokens: 3200,
                });
                const raw = res.text ?? '';
                const xml = this.extractXml(raw);
                return { xml, res };
            };

            // attempt 1
            let { xml, res } = await tryOnce(false);

            // attempt 2 (repair/extract), if needed
            if (!xml && XML_RETRY_STEPS > 1) {
                ({ xml, res } = await tryOnce(true));
            }

            const latency = Math.round(performance.now() - t0);
            this.tokenUsage = { total: res.tokens ?? 0 };
            this.rateInfo = res.rateInfo ?? null;

            if (!xml) {
                this.mutateMsg(thinking.id, {
                    kind: 'info',
                    content: 'Model did not return XML. Try “Generate source code” again or click “Refine requirements” to add details.',
                    latencyMs: latency,
                    tokens: res.tokens ?? undefined,
                });
                return;
            }

            // Show as XML bubble (Apply button is in the HTML)
            this.mutateMsg(thinking.id, {
                kind: 'xml',
                content: '',
                xml,
                summary: this.summarizeXml(xml) || 'Proposed XML',
                latencyMs: latency,
                tokens: res.tokens ?? undefined,
            });

            this.state.lastXml = xml;
            this.saveToStorage();
            this.scrollToBottomSoon();
        } catch (e: any) {
            this.mutateMsg(thinking.id, { kind: 'info', content: 'Error while generating XML.', error: e?.message || String(e) });
        } finally {
            this.isLoading = false;
            this.saveToStorage();
        }
    }

    /** Per-message import */
    async applyXml(xml: string) {
        try {
            await this.xmlValidation.validate(xml);
        } catch { /* let your DialogErrorsComponent surface details after import */ }
        try {
            this.modelImport.importFromXml(xml);
            // Leave the dialog so the user sees the model immediately
            this.onClose();
        } catch (e: any) {
            this.toast(`Import failed: ${e?.message || e}`);
        }
    }

    // ====== Prompt builders ======
    private systemPrompt(): string {
        // mortgage + request examples loaded in fewShotCache verbatim
        return [
            `You are a Petriflow process generator for Netgrif Builder.`,
            `Follow Petriflow structure exactly. Base yourself on the two examples below.`,
            `When asked to generate, output ONLY raw XML (no markdown, no comments, no prose).`,
            this.fewShotCache ? `\nFEW-SHOT EXAMPLES:\n${this.fewShotCache}\n` : ``,
        ].join('\n');
    }

    private buildPlanPrompt(userRequest: string): string {
        const currentXml = this.currentXmlCache ?? '';
        const normalized = userRequest.trim();

        const schema = `
Return JSON ONLY with this exact schema:
{
  "roles": string[],
  "data":  { "name": string, "type": string }[],
  "workflow": {
    "places": string[],
    "transitions": string[],
    "arcs": [{ "from": string, "to": string }]
  },
  "forms": [{ "transition": string, "fields": string[] }],
  "validations": string[],
  "events": string[],
  "summary": string
}
`.trim();

        const vaguenessHint =
            normalized.length < MIN_REQUEST_LEN
                ? `The user request is short/ambiguous. Make reasonable assumptions based on examples and produce a concrete plan.`
                : `If something is ambiguous, make reasonable defaults inspired by the examples.`;

        return [
            `User request:\n${normalized}`,
            vaguenessHint,
            `Produce a concise PLAN as JSON using the schema below. Do NOT generate XML. Do NOT ask questions.`,
            `Align naming with current model if it exists.`,
            schema,
            `Current model context: ${currentXml ? '(present)' : '(none)'}`
        ].join('\n\n');
    }

    // ====== Utils ======
    onComposerKeydown(e: KeyboardEvent) {
        const isMod = e.ctrlKey || e.metaKey;  // let OS shortcuts pass
        const isEnter = e.key === 'Enter';
        const isShift = e.shiftKey;
        if (isMod) return;
        if (isEnter && !isShift && !this.isLoading) {
            e.preventDefault();
            this.send();
        }
    }

    private pushMsg(init: Partial<ChatMessage>): ChatMessage {
        const msg: ChatMessage = {
            id: ++this._idSeq,
            role: init.role ?? 'assistant',
            kind: init.kind ?? 'info',
            content: init.content ?? '',
            timestamp: Date.now(),
            latencyMs: init.latencyMs,
            tokens: init.tokens,
            xml: init.xml,
            error: init.error,
            summary: init.summary,
            plan: init.plan,
        };
        this.messages = [...this.messages, msg];
        this.saveToStorage();
        this.scrollToBottomSoon();
        return msg;
    }

    private mutateMsg(id: number, patch: Partial<ChatMessage>) {
        this.messages = this.messages.map(m => m.id === id ? { ...m, ...patch } : m);
        this.saveToStorage();
    }

    private scrollToBottomSoon() {
        setTimeout(() => {
            const el = this.scrollArea?.nativeElement;
            if (el) el.scrollTop = el.scrollHeight;
        }, 0);
    }

    private toast(msg: string) { console.log('[Dialog]', msg); }

    private safeExportXml(): string {
        try { return this.modelExport.exportXml(); }
        catch (e) { this.toast('Export current XML failed.'); throw e; }
    }

    private extractXml(text: string): string | null {
        // 1) fenced ```xml ... ```
        const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1] : text;
        const trimmed = candidate.trim();
        // 2) explicit <document>...</document>
        const docMatch = trimmed.match(/<document\b[\s\S]*<\/document>/i);
        if (docMatch) return docMatch[0].trim();
        // 3) fallback sanity
        if (!trimmed.startsWith('<')) return null;
        if (!/(<transition[\s>])/.test(trimmed)) return null;
        if (!/(<place[\s>])/.test(trimmed)) return null;
        if (!/(<arc[\s>])/.test(trimmed)) return null;
        return trimmed;
    }

    /** Light sanity checks without matchAll */
    private lightXmlChecks(xml: string): boolean {
        const hasMissingId = (tag: 'place' | 'transition' | 'arc') => {
            const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
            let m: RegExpExecArray | null;
            while ((m = re.exec(xml)) !== null) {
                if (!/id="/i.test(m[0])) return true; // found a tag missing id
            }
            return false;
        };

        const okPlaces = !hasMissingId('place');
        const okTrans  = !hasMissingId('transition');
        const okArcs   = !hasMissingId('arc');
        return okPlaces && okTrans && okArcs;
    }

    /** Summary helper without matchAll; resilient to common Petriflow shapes */
    private summarizeXml(xml: string): string | null {
        try {
            // Try <title><text>...</text></title> first, then plain <title>
            let title = '';
            let m = /<title>\s*<text[^>]*>([\s\S]*?)<\/text>\s*<\/title>/i.exec(xml);
            if (m && m[1]) {
                title = m[1].trim();
            } else {
                m = /<title>\s*([^<]+)\s*<\/title>/i.exec(xml);
                if (m && m[1]) title = m[1].trim();
            }

            // Extract up to 3 transition labels / names
            const transitions: string[] = [];
            const blockRe = /<transition\b[^>]*>([\s\S]*?)<\/transition>/gi;
            let tb: RegExpExecArray | null;
            while ((tb = blockRe.exec(xml)) !== null && transitions.length < 3) {
                const wholeBlock = tb[0];

                // label text
                let name = '';
                let lm = /<label>[\s\S]*?<text[^>]*>([\s\S]*?)<\/text>[\s\S]*?<\/label>/i.exec(wholeBlock);
                if (lm && lm[1]) {
                    name = lm[1].trim();
                }

                // attribute name=
                if (!name) {
                    const nm = /<transition\b[^>]*\bname="([^"]+)"/i.exec(wholeBlock);
                    if (nm && nm[1]) name = nm[1].trim();
                }

                // attribute id=
                if (!name) {
                    const idm = /<transition\b[^>]*\bid="([^"]+)"/i.exec(wholeBlock);
                    if (idm && idm[1]) name = idm[1].trim();
                }

                if (name) transitions.push(name);
            }

            if (title && transitions.length) return `Model “${title}” – e.g. ${transitions.join(', ')}`;
            if (title) return `Model “${title}”`;
            if (transitions.length) return `Transitions: ${transitions.join(', ')}`;
            return 'Proposed XML';
        } catch {
            return null;
        }
    }

    private normalizeText(t: string): string {
        return t.replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .trim();
    }

    private formatPlan(t: string): string {
        return t.replace(/^\s*Generate XML now\?\s*$/mi, 'Generate XML now?').trim();
    }

    private sliceMiddle(s: string, maxChars: number): string {
        if (s.length <= maxChars) return s;
        const half = Math.floor(maxChars / 2);
        return s.slice(0, half) + '\n<!-- …snip… -->\n' + s.slice(s.length - half);
    }

    /** Strict JSON plan parsing */
    private tryParsePlan(text: string): PetriflowPlan | undefined {
        if (!text) return;
        let jsonStr = text.trim();

        // handle accidental code fence
        const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) jsonStr = fenced[1].trim();

        // try to locate the first { ... } block if model wrapped it
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
        }

        try {
            const obj = JSON.parse(jsonStr);
            // quick shape check
            if (!obj || typeof obj !== 'object') return;
            if (!Array.isArray(obj.roles)) obj.roles = [];
            if (!Array.isArray(obj.data)) obj.data = [];
            if (!obj.workflow) obj.workflow = { places: [], transitions: [], arcs: [] };
            if (!Array.isArray(obj.workflow.places)) obj.workflow.places = [];
            if (!Array.isArray(obj.workflow.transitions)) obj.workflow.transitions = [];
            if (!Array.isArray(obj.workflow.arcs)) obj.workflow.arcs = [];
            if (!Array.isArray(obj.forms)) obj.forms = [];
            if (!Array.isArray(obj.validations)) obj.validations = [];
            if (!Array.isArray(obj.events)) obj.events = [];
            if (typeof obj.summary !== 'string') obj.summary = '';
            return obj as PetriflowPlan;
        } catch {
            return;
        }
    }

    private serializePlan(plan: PetriflowPlan): string {
        // stable order to make prompts deterministic
        const ordered: PetriflowPlan = {
            roles: [...(plan.roles || [])],
            data: [...(plan.data || [])].map(d => ({ name: d.name, type: d.type })),
            workflow: {
                places: [...(plan.workflow?.places || [])],
                transitions: [...(plan.workflow?.transitions || [])],
                arcs: [...(plan.workflow?.arcs || [])].map(a => ({ from: a.from, to: a.to })),
            },
            forms: [...(plan.forms || [])].map(f => ({ transition: f.transition, fields: [...(f.fields || [])] })),
            validations: [...(plan.validations || [])],
            events: [...(plan.events || [])],
            summary: plan.summary || '',
        };
        return JSON.stringify(ordered, null, 2);
    }

    /** Dev helper: download transcript */
    downloadTranscript() {
        const blob = new Blob([JSON.stringify({ messages: this.messages, state: this.state }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `ai-assistant-transcript-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
