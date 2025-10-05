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

/** Other service interfaces */
export abstract class BuilderApiService {
    abstract exportFromBuilder(): Promise<string>;
    abstract importToBuilder(xml: string): Promise<void>;
}
export abstract class XmlValidationService {
    abstract validate(xml: string): Promise<void>;
}

/** Chat structures */
type MsgKind = 'user' | 'plan' | 'xml' | 'thinking' | 'info';

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
}

interface AssistantState {
    lastPlan?: string;       // the last structured plan we will generate XML from
    lastXml?: string;        // last generated XML
}

const STORAGE_KEY = 'nab.dialog.assistant.v2';

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

        // "thinking" placeholder
        const thinking = this.pushMsg({ role: 'assistant', kind: 'thinking', content: 'Thinking…' });

        // clear composer
        this.prompt = '';
        this.isLoading = true;
        this.scrollToBottomSoon();

        const t0 = performance.now();
        try {
            const planPrompt = this.buildPlanPrompt(content);
            const result = await this.openai.generate({
                system: this.systemPrompt(),
                user: planPrompt,
                model: this.selectedModel,
                maxOutputTokens: 1200,
            });

            // replace thinking with plan
            const latency = Math.round(performance.now() - t0);
            const planText = this.normalizeText(result.text ?? ''); // keep plain text (no markdown bold)
            this.tokenUsage = { total: result.tokens ?? 0 };
            this.rateInfo = result.rateInfo ?? null;

            this.mutateMsg(thinking.id, {
                kind: 'plan',
                content: this.formatPlan(planText),
                latencyMs: latency,
                tokens: result.tokens ?? undefined,
            });

            this.state.lastPlan = planText;
            this.saveToStorage();
            this.scrollToBottomSoon();
        } catch (e: any) {
            this.mutateMsg(thinking.id, {
                kind: 'info',
                content: 'Error while planning.',
                error: e?.message || String(e),
            });
        } finally {
            this.isLoading = false;
            this.saveToStorage();
        }
    }

    /** Button shown on a plan bubble */
    async generateXmlFromPlan(planMsg: ChatMessage) {
        if (this.isLoading) return;

        // create a new "thinking…" bubble attached to this plan
        const thinking = this.pushMsg({ role: 'assistant', kind: 'thinking', content: 'Generating XML…' });
        this.isLoading = true;
        this.scrollToBottomSoon();
        const t0 = performance.now();

        try {
            const currentXml = this.currentXmlCache ?? this.safeExportXml();
            const attachmentsBlock = this.attachments.length
                ? '\n' + this.attachments.map(a =>
                `---ATTACHMENT:${a.name}---\n${a.text}\n---END_ATTACHMENT---`).join('\n')
                : '';

            const xmlPrompt =
                `Create a VALID Petriflow process XML using this PLAN and CURRENT MODEL.\n\n` +
                `PLAN:\n${this.state.lastPlan || planMsg.content}\n\n` +
                `CURRENT_MODEL_XML:\n---XML_START---\n${this.sliceMiddle(currentXml, 12000)}\n---XML_END---\n` +
                `${attachmentsBlock}\n` +
                `Rules:\n- DO NOT re-plan. Output ONLY XML.\n- Ensure unique ids for <place>, <transition>, <arc>.\n- Include <role>, <data>, <dataGroup>/<dataRef>, <roleRef> in transitions where relevant.\n- Include a minimal but connected net with tokens and arcs.\n- Validate against Petriflow structure as in the examples.\n`;

            const result = await this.openai.generate({
                system: this.systemPrompt(),
                user: xmlPrompt,
                model: this.selectedModel,
                maxOutputTokens: 3000, // budget
            });

            const latency = Math.round(performance.now() - t0);
            const raw = result.text ?? '';
            const xml = this.extractXml(raw);

            if (!xml) {
                this.mutateMsg(thinking.id, {
                    kind: 'info',
                    content: 'Model did not return XML. Please try “Generate XML” again or refine the plan.',
                    latencyMs: latency,
                    tokens: result.tokens ?? undefined,
                });
                return;
            }

            // optional light checks
            const ok = this.lightXmlChecks(xml);
            if (!ok) {
                // still show for Apply (ModelImportService surfaces errors precisely)
            }

            // add as xml bubble with minimal text (only Apply)
            this.mutateMsg(thinking.id, {
                kind: 'xml',
                content: '', // no duplicate text
                xml,
                summary: this.summarizeXml(xml) || 'Proposed XML',
                latencyMs: latency,
                tokens: result.tokens ?? undefined,
            });

            this.state.lastXml = xml;
            this.saveToStorage();
            this.scrollToBottomSoon();
        } catch (e: any) {
            this.mutateMsg(thinking.id, {
                kind: 'info',
                content: 'Error while generating XML.',
                error: e?.message || String(e),
            });
        } finally {
            this.isLoading = false;
            this.saveToStorage();
        }
    }

    /** Per-message import */
    async applyXml(xml: string) {
        try {
            await this.xmlValidation.validate(xml);
        } catch { /* show detailed errors via your Dialog component after import */ }
        try { this.modelImport.importFromXml(xml); }
        catch (e: any) { this.toast(`Import failed: ${e?.message || e}`); }
    }

    // ====== Prompt builders ======
    private systemPrompt(): string {
        // mortgage + request examples loaded in fewShotCache verbatim
        return [
            `You are a Petriflow process generator for Netgrif Builder.`,
            `Follow Petriflow structure exactly. Base yourself on the two examples below.`,
            `Never output explanations or markdown. When asked to generate, output ONLY raw XML.`,
            this.fewShotCache ? `\nFEW-SHOT EXAMPLES:\n${this.fewShotCache}\n` : ``,
        ].join('\n');
    }

    private buildPlanPrompt(userRequest: string): string {
        const currentXml = this.currentXmlCache ?? '';
        return [
            `User request:\n${userRequest}`,
            `Produce a concise PLAN (roles, data, tasks/transitions, places/arcs sketch, validations, automation/events).`,
            `Do NOT generate XML here. Finish with one line: "Generate XML now?"`,
            `Current model context may influence diffs:\n${this.currentXmlCache ? '(context present)' : '(no context)'}`
        ].join('\n\n');
    }

    // ====== Utils ======
    onComposerKeydown(e: KeyboardEvent) {
        const isMod = e.ctrlKey || e.metaKey;           // Ctrl on Win/Linux, Cmd on macOS
        const isEnter = e.key === 'Enter';
        const isShift = e.shiftKey;

        // Let all OS shortcuts pass (copy/paste/cut/select-all/undo/redo…)
        if (isMod) return;

        // Submit on Enter (but allow Shift+Enter for newline)
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
        // smooth “follow the typing/answer” behavior
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
        const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1] : text;
        const trimmed = candidate.trim();
        if (!trimmed.startsWith('<')) return null;
        // quick sanity: must close > and contain <transition> and <place> and <arc>
        if (!/(<transition[\s>])/.test(trimmed)) return null;
        if (!/(<place[\s>])/.test(trimmed)) return null;
        if (!/(<arc[\s>])/.test(trimmed)) return null;
        return trimmed;
    }

    /** Light sanity checks without using matchAll */
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

            // Extract up to 3 transition "names":
            // 1) <transition ...><label><text>NAME</text>...</label>...
            // 2) or fallback: name="..." attribute
            // 3) or fallback: id="..."
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
        // strip markdown **bold** and headlines so UI renders plain text plan
        return t.replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .trim();
    }

    private formatPlan(t: string): string {
        // keep plan readable; do not echo "Generate XML now?" twice
        return t.replace(/^\s*Generate XML now\?\s*$/mi, 'Generate XML now?').trim();
    }

    private sliceMiddle(s: string, maxChars: number): string {
        if (s.length <= maxChars) return s;
        const half = Math.floor(maxChars / 2);
        return s.slice(0, half) + '\n<!-- …snip… -->\n' + s.slice(s.length - half);
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
