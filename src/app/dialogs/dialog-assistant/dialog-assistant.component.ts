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

// IMPORTANT: ponechávame typ OpenAiService, ale provider je OpenAiProxyService (volá 4200)
import { OpenAiService, PETRIFLOW_MODELS } from './openai-http.service';
import { OpenAiProxyService } from './openai-proxy.service';
import { PetriflowExamplesService } from './petriflow-examples.service';
import {AiRelayService} from "../../services/ai-relay.service";

/** Integration stubs (replace with real app services when ready) */
export abstract class BuilderApiService {
    abstract exportFromBuilder(): Promise<string>;
    abstract importToBuilder(xml: string): Promise<void>;
}
export abstract class XmlValidationService {
    abstract validate(xml: string): Promise<void>;
}

/** ====== Chat types (BRD/TECH + XML bubble kinds) ====== */
type MsgKind = 'user' | 'brd' | 'tech' | 'xml' | 'thinking' | 'info';

export interface BrdDoc {
    title: string;
    problem: string;
    goals: string[];
    scopeIn: string[];
    scopeOut: string[];
    personas: string[];
    userStories: string[];
    acceptanceCriteria: string[];
    risks: string[];
    successMetrics: string[];
    summary: string;
}

export interface TechSpec {
    roles: string[];
    data: { name: string; type: string; required?: boolean; enumValues?: string[] }[];
    workflow: {
        places: string[];
        transitions: string[];
        arcs: { from: string; to: string }[];
    };
    forms: { transition: string; fields: string[] }[];
    validations: string[];
    events: string[];
    mappingNotes: string[];
    summary: string;
}

export interface DraftBundle {
    brd: BrdDoc;
    tech: TechSpec;
    version: number;
    sourcePrompt: string;
    changeLog?: string[];
}

/** legacy shape (for migration only) */
interface PetriflowPlanLegacy {
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

/** Chat bubble */
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
    brd?: BrdDoc;
    tech?: TechSpec;
    changeLog?: string[];
}

interface AssistantState {
    draft?: DraftBundle;  // live BRD+TECH draft
    lastXml?: string;     // last generated XML (one-shot or wizard)
}

// Heuristics / tuning
const MIN_REQUEST_LEN = 12;

/** ====== NEW: XML step-by-step pipeline ====== */
type XmlStep =
    | 'header'
    | 'roles'
    | 'data'
    | 'transitions'
    | 'forms'
    | 'events'
    | 'places_arcs'
    | 'finalize';

interface XmlParts {
    header?: string;
    roles?: string;
    data?: string;
    transitions?: string;  // transitions skeleton (no forms/events)
    forms?: string;        // only <dataGroup> fragments mapped into transitions
    events?: string;       // event fragments mapped into transitions/data
    places?: string;
    arcs?: string;
}

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
        // ⬇⬇ (KROK 1.3) PROXY → volá parent (4200) cez postMessage
        { provide: OpenAiService, useClass: OpenAiProxyService },
        // Dočasné stuby — nechávam bez zmeny
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
    public state: AssistantState = {};
    private fewShotCache = '';

    // TECH bubble collapsed state
    showTechCollapsedById: Record<number, boolean> = {};

    /** ====== Wizard state ====== */
    public xmlWizardActive = false;
    public xmlCurrentStep: XmlStep = 'header';
    public xmlParts: XmlParts = {};
    public xmlStepError: string | null = null;

    constructor(
        private dialogRef: MatDialogRef<DialogAssistantComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private openai: OpenAiService,
        private builder: BuilderApiService,
        private xmlValidation: XmlValidationService,
        private relay: AiRelayService,
        private modelExport: ModelExportService,
        private modelImport: ModelImportService,
        private examples: PetriflowExamplesService,
    ) {}

    async ngOnInit(): Promise<void> {
        this.loadFromStorage();
        this.fewShotCache = await this.examples.getFewShot();
        try { this.currentXmlCache = this.safeExportXml(); } catch {}
        this.scrollToBottomSoon();
    }

    // ====== Persistence (lokálne uloženie histórie) ======
    private saveToStorage() {
        const payload = { messages: this.messages, state: this.state, selectedModel: this.selectedModel };
        try { localStorage.setItem('nab.dialog.assistant.v3', JSON.stringify(payload)); } catch {}
    }
    private loadFromStorage() {
        try {
            const raw = localStorage.getItem('nab.dialog.assistant.v3');
            if (raw) {
                const parsed = JSON.parse(raw);
                this.messages = (parsed.messages ?? []).map((m: ChatMessage) => ({ ...m }));
                this.state = parsed.state ?? {};
                this.selectedModel = parsed.selectedModel ?? this.selectedModel;
                this._idSeq = this.messages.reduce((mx, m) => Math.max(mx, m.id), 0);
                return;
            }
            const rawV2 = localStorage.getItem('nab.dialog.assistant.v2');
            if (rawV2) {
                const parsed = JSON.parse(rawV2);
                this.messages = (parsed.messages ?? []).map((m: any) => this.migrateMsgV2(m));
                const legacyPlan = parsed.state?.lastPlan as PetriflowPlanLegacy | undefined;
                if (legacyPlan) this.state.draft = this.fromLegacyPlan(legacyPlan, parsed.state?.lastXml);
                if (parsed.state?.lastXml) this.state.lastXml = parsed.state.lastXml;
                this.selectedModel = parsed.selectedModel ?? this.selectedModel;
                this._idSeq = this.messages.reduce((mx, m) => Math.max(mx, m.id), 0);
                this.saveToStorage();
            }
        } catch {}
    }
    private migrateMsgV2(m: any): ChatMessage {
        const kind = (m.kind as MsgKind) ?? 'info';
        return {
            id: m.id, role: m.role, kind,
            content: m.content ?? '', timestamp: m.timestamp ?? Date.now(),
            latencyMs: m.latencyMs, tokens: m.tokens, xml: m.xml, error: m.error,
            summary: m.summary
        };
    }
    private fromLegacyPlan(plan: PetriflowPlanLegacy, _lastXml?: string): DraftBundle {
        const brd: BrdDoc = {
            title: 'Migrated Draft', problem: '', goals: ['Goal derived from legacy plan'],
            scopeIn: [], scopeOut: [], personas: [], userStories: [],
            acceptanceCriteria: [], risks: [], successMetrics: [], summary: plan.summary || 'Legacy summary'
        };
        const tech: TechSpec = {
            roles: plan.roles || [],
            data: (plan.data || []).map(d => ({ name: d.name, type: d.type })),
            workflow: {
                places: plan.workflow?.places || [],
                transitions: plan.workflow?.transitions || [],
                arcs: plan.workflow?.arcs || []
            },
            forms: plan.forms || [],
            validations: plan.validations || [],
            events: plan.events || [],
            mappingNotes: ['Migrated from legacy PetriflowPlan'],
            summary: plan.summary || ''
        };
        return { brd, tech, version: 1, sourcePrompt: 'migrated' };
    }

    // ====== Actions ======
    onClose() { this.dialogRef.close(); }
    onAttachContext() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.txt,.md,.json,.xml';
        input.onchange = async () => {
            const f = input.files?.[0]; if (!f) return;
            try {
                const text = await f.text();
                this.attachments.push({ name: f.name, text });
                this.toast(`Attached: ${f.name}`);
            } catch (e: any) { this.toast(`Attachment failed: ${e?.message || e}`); }
        };
        input.click();
    }
    onClear() {
        this.messages = []; this.state = {};
        this.resetXmlPipeline(); this.saveToStorage();
    }
    downloadTranscript() {
        const blob = new Blob([JSON.stringify({ messages: this.messages, state: this.state }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `ai-assistant-transcript-${new Date().toISOString()}.json`;
        a.click(); URL.revokeObjectURL(url);
    }

    trackByMsgFn = (_: number, m: ChatMessage) => m.id;

    // ====== Main flow ======
    async send() {
        const content = (this.prompt || '').trim();
        if (!content || this.isLoading) return;

        this.pushMsg({ role: 'user', kind: 'user', content });
        const thinking = this.pushMsg({ role: 'assistant', kind: 'thinking', content: 'Analyzing & drafting…' });

        this.prompt = ''; this.isLoading = true; this.scrollToBottomSoon();

        const t0 = performance.now();
        try {
            if (this.state.draft) {
                await this.handleRefineInternal(content, thinking, t0);
                return;
            }

            const dualPrompt = this.buildDualDraftPrompt(content);
            const result = await this.openai.generate({
                system: this.systemPrompt(),
                user: dualPrompt,
                model: this.selectedModel,
                maxOutputTokens: 1800,
            });

            const latency = Math.round(performance.now() - t0);
            this.tokenUsage = { total: result.tokens ?? 0 };
            this.rateInfo = result.rateInfo ?? null;

            const bundle = this.tryParseBundle(result.text || '');
            if (!bundle) {
                this.mutateMsg(thinking.id, {
                    kind: 'info',
                    content: 'Could not assemble a BRD/TECH draft. Please add more detail (goal, roles, key steps) and try again.',
                    latencyMs: latency,
                    tokens: result.tokens ?? undefined
                });
                return;
            }

            bundle.version = 1;
            bundle.sourcePrompt = content;
            this.state.draft = bundle;

            this.mutateMsg(thinking.id, { kind: 'brd', content: this.renderBrdText(bundle.brd), brd: bundle.brd, latencyMs: latency, tokens: result.tokens ?? undefined });
            const techMsg = this.pushMsg({ role: 'assistant', kind: 'tech', content: this.renderTechText(bundle.tech), tech: bundle.tech });
            this.showTechCollapsedById[techMsg.id] = true;

            this.saveToStorage(); this.scrollToBottomSoon();
        } catch (e: any) {
            this.mutateMsg(thinking.id, { kind: 'info', content: '  Error while generating the draft.', error: e?.message || String(e) });
        } finally {
            this.isLoading = false; this.saveToStorage();
        }
    }

    async refine(editTarget: 'both' | 'brd' | 'tech' = 'both') {
        const content = (this.prompt || '').trim();
        if (!content || this.isLoading) return;
        this.pushMsg({ role: 'user', kind: 'user', content: `[Refine ${editTarget.toUpperCase()}] ${content}` });

        const thinking = this.pushMsg({ role: 'assistant', kind: 'thinking', content: 'Refining draft…' });
        this.prompt = ''; this.isLoading = true;

        const t0 = performance.now();
        try {
            await this.handleRefineInternal(content, thinking, t0, editTarget);
        } catch (e: any) {
            this.mutateMsg(thinking.id, { kind: 'info', content: 'Error while refining.', error: e?.message || e });
        } finally {
            this.isLoading = false; this.saveToStorage();
        }
    }

    async generateXmlFromDraft() {
        if (this.isLoading) return;
        if (!this.state.draft?.tech) { this.toast('No technical design is available.'); return; }
        await this.runWizardEndToEnd();
    }

    private async runWizardEndToEnd() {
        this.startXmlWizard();
        const steps: XmlStep[] = ['header','roles','data','transitions','forms','events','places_arcs'];
        for (const s of steps) {
            await this.generateXmlStep(s);
            if (this.xmlStepError) {
                this.pushMsg({ role: 'assistant', kind: 'info', content: `XML step "${s}" failed: ${this.xmlStepError}` });
                return;
            }
        }
        await this.generateXmlStep('finalize');
    }

    async applyXml(xml: string) {
        try {
            this.modelImport.importFromXml(xml);
            this.onClose();
        } catch (e: any) {
            this.toast(`Import failed: ${e?.message || e}`);
        }
    }

    // ====== Prompt builders ======
    private systemPrompt(): string {
        return [
            `You are a Netgrif Assistant generating a dual output:`,
            `1) BRD (Business Requirements Document) – WHY/WHAT.`,
            `2) TECH (Petriflow design) – HOW (but NOT XML).`,
            `Keep BRD and TECH consistent and implementable.`,
            `Never output XML unless specifically asked in a dedicated XML step.`,
            this.fewShotCache ? `\nFEW-SHOT EXAMPLES:\n${this.fewShotCache}\n` : ``,
        ].join('\n');
    }
    private systemPromptForXml(): string {
        return [
            `You are a Petriflow XML generator for Netgrif Builder.`,
            `Output ONLY raw XML (no markdown, no prose, no comments).`,
            this.fewShotCache ? `\nFEW-SHOT EXAMPLES:\n${this.fewShotCache}\n` : ``,
        ].join('\n');
    }

    private buildDualDraftPrompt(userRequest: string): string {
        const currentXml = this.currentXmlCache ?? '';
        const normalized = userRequest.trim();

        const schema = `
Return JSON ONLY with this exact schema:
{
  "brd": {
    "title": string,
    "problem": string,
    "goals": string[],
    "scopeIn": string[],
    "scopeOut": string[],
    "personas": string[],
    "userStories": string[],
    "acceptanceCriteria": string[],
    "risks": string[],
    "successMetrics": string[],
    "summary": string
  },
  "tech": {
    "roles": string[],
    "data": { "name": string, "type": string, "required"?: boolean, "enumValues"?: string[] }[],
    "workflow": {
      "places": string[],
      "transitions": string[],
      "arcs": [{ "from": string, "to": string }]
    },
    "forms": [{ "transition": string, "fields": string[] }],
    "validations": string[],
    "events": string[],
    "mappingNotes": string[],
    "summary": string
  }
}
`.trim();

        const vaguenessHint =
            normalized.length < MIN_REQUEST_LEN
                ? `The user request is short/ambiguous. Make reasonable assumptions and produce a concrete BRD and TECH.`
                : `If something is ambiguous, choose sensible defaults and explain rationale in mappingNotes.`;

        const contextHint = currentXml
            ? 'Existing Petriflow model is present; align naming and reuse where possible.'
            : 'No existing model; propose clean defaults with clear names.';

        const attachmentsBlock = this.attachments.length
            ? '\n' + this.attachments.map(a => `---ATTACHMENT:${a.name}---\n${a.text}\n---END_ATTACHMENT---`).join('\n')
            : '';

        return [
            `USER REQUEST:\n${normalized}`,
            vaguenessHint,
            `CONTEXT: ${contextHint}`,
            currentXml ? `CURRENT_MODEL_XML:\n---XML_START---\n${this.sliceMiddle(currentXml, 10000)}\n---XML_END---` : '',
            attachmentsBlock ? `ATTACHMENTS:\n${attachmentsBlock}` : '',
            `Produce BOTH documents now. Do NOT generate XML.`,
            schema
        ].filter(Boolean).join('\n\n');
    }

    private buildRefinePrompt(userEdit: string, draft: DraftBundle, editTarget: 'both'|'brd'|'tech' = 'both'): string {
        const schema = `
Return JSON ONLY with this exact schema:
{
  "brd": ${this.inlineShape('BrdDoc')},
  "tech": ${this.inlineShape('TechSpec')},
  "changeLog": string[]
}
`.trim();

        const focus = editTarget === 'both'
            ? 'Update both BRD and TECH.'
            : editTarget === 'brd'
                ? 'Update BRD primarily; adjust TECH only if needed to keep consistency.'
                : 'Update TECH primarily; adjust BRD only if needed to keep consistency.';

        const instr = `
Refine the existing BRD and TECH according to the USER EDIT below.
- ${focus}
- Keep structure and naming stable where possible (no resets).
- Reflect BRD→TECH mapping in mappingNotes when relevant.
- DO NOT output XML.
`.trim();

        const draftJson = JSON.stringify(draft, null, 2);
        const draftForPrompt = draftJson.length > 24000
            ? JSON.stringify({
                brd: { title: draft.brd.title, summary: draft.brd.summary, userStories: draft.brd.userStories, goals: draft.brd.goals },
                tech: draft.tech
            }, null, 2)
            : draftJson;

        return [
            `CURRENT_DRAFT(JSON):\n${draftForPrompt}`,
            `USER_EDIT:\n${userEdit.trim()}`,
            instr,
            this.explicitShapes(),
            schema
        ].join('\n\n');
    }

    // ====== Parsing / rendering helpers ======
    private tryParseBundle(text: string): DraftBundle | undefined {
        if (!text) return;
        let jsonStr = text.trim();

        const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) jsonStr = fenced[1].trim();

        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
        }

        try {
            const obj = JSON.parse(jsonStr);
            const brd: BrdDoc = this.ensureBrd(obj.brd || {});
            const tech: TechSpec = this.ensureTech(obj.tech || {});
            return { brd, tech, version: 1, sourcePrompt: '' };
        } catch { return; }
    }
    private ensureBrd(b: any): BrdDoc {
        return {
            title: String(b.title ?? 'Untitled initiative'),
            problem: String(b.problem ?? ''),
            goals: Array.isArray(b.goals) ? b.goals.map(String) : [],
            scopeIn: Array.isArray(b.scopeIn) ? b.scopeIn.map(String) : [],
            scopeOut: Array.isArray(b.scopeOut) ? b.scopeOut.map(String) : [],
            personas: Array.isArray(b.personas) ? b.personas.map(String) : [],
            userStories: Array.isArray(b.userStories) ? b.userStories.map(String) : [],
            acceptanceCriteria: Array.isArray(b.acceptanceCriteria) ? b.acceptanceCriteria.map(String) : [],
            risks: Array.isArray(b.risks) ? b.risks.map(String) : [],
            successMetrics: Array.isArray(b.successMetrics) ? b.successMetrics.map(String) : [],
            summary: String(b.summary ?? ''),
        };
    }
    private ensureTech(t: any): TechSpec {
        const data = Array.isArray(t.data) ? t.data.map((d: any) => ({
            name: String(d.name ?? ''),
            type: String(d.type ?? 'text'),
            required: typeof d.required === 'boolean' ? d.required : undefined,
            enumValues: Array.isArray(d.enumValues) ? d.enumValues.map(String) : undefined
        })) : [];

        return {
            roles: Array.isArray(t.roles) ? t.roles.map(String) : [],
            data,
            workflow: {
                places: Array.isArray(t.workflow?.places) ? t.workflow.places.map(String) : [],
                transitions: Array.isArray(t.workflow?.transitions) ? t.workflow.transitions.map(String) : [],
                arcs: Array.isArray(t.workflow?.arcs) ? t.workflow.arcs.map((a: any) => ({ from: String(a.from ?? ''), to: String(a.to ?? '') })) : [],
            },
            forms: Array.isArray(t.forms) ? t.forms.map((f: any) => ({ transition: String(f.transition ?? ''), fields: Array.isArray(f.fields) ? f.fields.map(String) : [] })) : [],
            validations: Array.isArray(t.validations) ? t.validations.map(String) : [],
            events: Array.isArray(t.events) ? t.events.map(String) : [],
            mappingNotes: Array.isArray(t.mappingNotes) ? t.mappingNotes.map(String) : [],
            summary: String(t.summary ?? ''),
        };
    }
    private renderBrdText(brd: BrdDoc): string {
        const lines: string[] = [];
        lines.push(`**${brd.title || 'BRD'}**`);
        if (brd.summary) lines.push(`_${brd.summary}_`);
        if (brd.problem) lines.push(`\n**Problem**: ${brd.problem}`);
        if (brd.goals?.length) lines.push(`**Goals:**\n- ${brd.goals.join('\n- ')}`);
        if (brd.userStories?.length) lines.push(`**User stories:**\n- ${brd.userStories.join('\n- ')}`);
        if (brd.acceptanceCriteria?.length) lines.push(`**Acceptance criteria:**\n- ${brd.acceptanceCriteria.join('\n- ')}`);
        if (brd.successMetrics?.length) lines.push(`**Success metrics:**\n- ${brd.successMetrics.join('\n- ')}`);
        if (brd.scopeIn?.length) lines.push(`**Scope IN:**\n- ${brd.scopeIn.join('\n- ')}`);
        if (brd.scopeOut?.length) lines.push(`**Scope OUT:**\n- ${brd.scopeOut.join('\n- ')}`);
        if (brd.personas?.length) lines.push(`**Personas:** ${brd.personas.join(', ')}`);
        if (brd.risks?.length) lines.push(`**Risks/Assumptions:**\n- ${brd.risks.join('\n- ')}`);
        return lines.join('\n');
    }
    private renderTechText(tech: TechSpec): string {
        const lines: string[] = [];
        lines.push(`**TECH: Petriflow design**`);
        if (tech.summary) lines.push(`_${tech.summary}_`);
        if (tech.roles?.length) lines.push(`\n**Roles:** ${tech.roles.join(', ')}`);
        if (tech.data?.length) {
            lines.push(`**Data:**`);
            tech.data.forEach(d => lines.push(`- ${d.name} : ${d.type}${d.required ? ' (required)' : ''}${d.enumValues?.length ? ` [${d.enumValues.join(', ')}]` : ''}`));
        }
        if (tech.workflow?.places?.length) lines.push(`**Places:** ${tech.workflow.places.join(', ')}`);
        if (tech.workflow?.transitions?.length) lines.push(`**Transitions:** ${tech.workflow.transitions.join(', ')}`);
        if (tech.workflow?.arcs?.length) {
            lines.push(`**Arcs:**`);
            tech.workflow.arcs.forEach(a => lines.push(`- ${a.from} → ${a.to}`));
        }
        if (tech.forms?.length) lines.push(`**Forms:**\n${tech.forms.map(f => `- ${f.transition}: [${f.fields.join(', ')}]`).join('\n')}`);
        if (tech.validations?.length) lines.push(`**Validations:**\n- ${tech.validations.join('\n- ')}`);
        if (tech.events?.length) lines.push(`**Events:**\n- ${tech.events.join('\n- ')}`);
        if (tech.mappingNotes?.length) lines.push(`**Mapping notes:**\n- ${tech.mappingNotes.join('\n- ')}`);
        return lines.join('\n');
    }
    makeBrdEditSeed(_brd: BrdDoc): string {
        return [
            `[Edit BRD]`,
            `- Update goals to: ...`,
            `- Add user story: As <role> I want <goal> so that <value>`,
            `- Clarify acceptance criteria: ...`,
            `- In scope: ... / Out of scope: ...`,
        ].join('\n');
    }
    makeTechEditSeed(_tech: TechSpec): string {
        return [
            `[Edit TECH]`,
            `- Change data: <field> type to <text|number|date|enum|file|boolean|user>, required`,
            `- Add transition: <Name>`,
            `- Form "<transition>": add fields <a,b,c>`,
            `- Validation: ...`,
            `- Event: ...`,
        ].join('\n');
    }

    private async handleRefineInternal(userEdit: string, thinkingMsg: ChatMessage, t0: number, editTarget: 'both'|'brd'|'tech' = 'both') {
        const draft = this.state.draft!;
        const refinePrompt = this.buildRefinePrompt(userEdit, draft, editTarget);
        const result = await this.openai.generate({
            system: this.systemPrompt(),
            user: refinePrompt,
            model: this.selectedModel,
            maxOutputTokens: 1800,
        });

        const latency = Math.round(performance.now() - t0);
        this.tokenUsage = { total: result.tokens ?? 0 };
        this.rateInfo = result.rateInfo ?? null;

        const parsed = this.tryParseBundleWithChangelog(result.text || '');
        if (!parsed) {
            this.mutateMsg(thinkingMsg.id, {
                kind: 'info',
                content: 'Refine did not succeed. Try specifying concrete edits (e.g., “Add transition Approve; amount is number, required”).',
                latencyMs: latency,
                tokens: result.tokens ?? undefined
            });
            return;
        }

        const newBundle: DraftBundle = {
            brd: parsed.brd,
            tech: parsed.tech,
            version: draft.version + 1,
            sourcePrompt: userEdit,
            changeLog: parsed.changeLog || [],
        };
        this.state.draft = newBundle;

        this.mutateMsg(thinkingMsg.id, { kind: 'brd', content: this.renderBrdText(newBundle.brd), brd: newBundle.brd, latencyMs: latency, tokens: result.tokens ?? undefined, changeLog: newBundle.changeLog });
        const techMsg = this.pushMsg({ role: 'assistant', kind: 'tech', content: this.renderTechText(newBundle.tech), tech: newBundle.tech, changeLog: newBundle.changeLog });
        this.showTechCollapsedById[techMsg.id] = true;

        this.saveToStorage(); this.scrollToBottomSoon();
    }
    private tryParseBundleWithChangelog(text: string): (DraftBundle & { changeLog?: string[] }) | undefined {
        if (!text) return;
        let jsonStr = text.trim();

        const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) jsonStr = fenced[1].trim();

        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
        }

        try {
            const obj = JSON.parse(jsonStr);
            const brd = this.ensureBrd(obj.brd || {});
            const tech = this.ensureTech(obj.tech || {});
            const changeLog = Array.isArray(obj.changeLog) ? obj.changeLog.map(String) : undefined;
            return { brd, tech, version: 1, sourcePrompt: '', changeLog };
        } catch { return; }
    }

    // ====== Composer & bubble utils ======
    onComposerKeydown(e: KeyboardEvent) {
        const isMod = e.ctrlKey || e.metaKey;
        const isEnter = e.key === 'Enter';
        if (isMod) return;
        if (isEnter && !e.shiftKey && !this.isLoading) {
            e.preventDefault();
            this.send();
        }
    }
    toggleTechCollapsed(messageId: number) {
        this.showTechCollapsedById[messageId] = !this.showTechCollapsedById[messageId];
    }
    async copyMsg(msg: ChatMessage) {
        try {
            let toCopy = '';
            if (msg.kind === 'xml' && msg.xml) toCopy = msg.xml;
            else if (msg.kind === 'brd' && msg.brd) toCopy = this.renderBrdText(msg.brd);
            else if (msg.kind === 'tech' && msg.tech) toCopy = this.renderTechText(msg.tech);
            else toCopy = msg.content || '';
            await navigator.clipboard.writeText(toCopy);
            this.toast('Copied to clipboard.');
        } catch { this.toast('Copy failed.'); }
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
            brd: init.brd,
            tech: init.tech,
            changeLog: init.changeLog,
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

    // ====== XML helpers ======
    private safeExportXml(): string {
        try { return this.modelExport.exportXml(); }
        catch (e) { this.toast('Export current XML failed.'); throw e; }
    }
    private extractXml(text: string): string | null {
        const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1] : text;
        const trimmed = candidate.trim();
        const docMatch = trimmed.match(/<document\b[\s\S]*<\/document>/i);
        if (docMatch) return docMatch[0].trim();
        if (!trimmed.startsWith('<')) return null;
        if (!/(<transition[\s>])/.test(trimmed)) return null;
        if (!/(<place[\s>])/.test(trimmed)) return null;
        if (!/(<arc[\s>])/.test(trimmed)) return null;
        return trimmed;
    }
    private summarizeXml(xml: string): string | null {
        try {
            let title = '';
            let m = /<title>\s*<text[^>]*>([\s\S]*?)<\/text>\s*<\/title>/i.exec(xml);
            if (m && m[1]) title = m[1].trim();
            else {
                m = /<title>\s*([^<]+)\s*<\/title>/i.exec(xml);
                if (m && m[1]) title = m[1].trim();
            }

            const transitions: string[] = [];
            const blockRe = /<transition\b[^>]*>([\s\S]*?)<\/transition>/gi;
            let tb: RegExpExecArray | null;
            while ((tb = blockRe.exec(xml)) !== null && transitions.length < 3) {
                const wholeBlock = tb[0];
                let name = '';
                let lm = /<label>[\s\S]*?<text[^>]*>([\s\S]*?)<\/text>[\s\S]*?<\/label>/i.exec(wholeBlock);
                if (lm && lm[1]) name = lm[1].trim();
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
        } catch { return null; }
    }
    private sliceMiddle(s: string, maxChars: number): string {
        if (s.length <= maxChars) return s;
        const half = Math.floor(maxChars / 2);
        return s.slice(0, half) + '\n<!-- …snip… -->\n' + s.slice(s.length - half);
    }

    private inlineShape(kind: 'BrdDoc'|'TechSpec'): string {
        if (kind === 'BrdDoc') {
            return `{
  "title": string,
  "problem": string,
  "goals": string[],
  "scopeIn": string[],
  "scopeOut": string[],
  "personas": string[],
  "userStories": string[],
  "acceptanceCriteria": string[],
  "risks": string[],
  "successMetrics": string[],
  "summary": string
}`;
        }
        return `{
  "roles": string[],
  "data": { "name": string, "type": string, "required"?: boolean, "enumValues"?: string[] }[],
  "workflow": {
    "places": string[],
    "transitions": string[],
    "arcs": [{ "from": string, "to": string }]
  },
  "forms": [{ "transition": string, "fields": string[] }],
  "validations": string[],
  "events": string[],
  "mappingNotes": string[],
  "summary": string
}`;
    }
    private explicitShapes(): string {
        return `Shape BrdDoc / TechSpec are as follows for reference only:
BrdDoc = ${this.inlineShape('BrdDoc')}
TechSpec = ${this.inlineShape('TechSpec')}`;
    }

    // =========================================================================================
    //                           XML WIZARD (step-by-step generation)
    // =========================================================================================

    public resetXmlPipeline() {
        this.xmlWizardActive = false;
        this.xmlCurrentStep = 'header';
        this.xmlParts = {};
        this.xmlStepError = null;
    }

    public startXmlWizard() {
        if (!this.state.draft?.tech) { this.toast('No TECH spec available to generate from.'); return; }
        this.xmlWizardActive = true;
        this.xmlCurrentStep = 'header';
        this.xmlParts = {};
        this.xmlStepError = null;
    }

    public async generateXmlStep(step: XmlStep) {
        if (this.isLoading) return;
        if (!this.state.draft?.tech) { this.toast('No TECH spec available.'); return; }

        if (step === 'finalize') {
            return this.assembleFinalXml();
        }

        this.isLoading = true;
        this.xmlStepError = null;

        const t0 = performance.now();
        try {
            const tech = this.state.draft.tech;
            const skeleton = this.renderXmlTemplate(this.xmlParts);

            const prompt = this.buildSectionPrompt(step, tech, skeleton);
            const res = await this.openai.generateXmlStep({
                step,
                tech,
                skeleton,
                model: this.selectedModel,
                maxOutputTokens: 2000,
            });

            const latency = Math.round(performance.now() - t0);
            this.tokenUsage = { total: res.tokens ?? 0 };
            this.rateInfo = res.rateInfo ?? null;

            const raw = (res.text ?? '').trim();
            const fragment = this.extractFragmentXml(raw);
            if (!fragment) {
                this.xmlStepError = `The model did not return valid ${step} fragment.`;
                this.isLoading = false;
                return;
            }

            await this.applyFragment(step, fragment);

            this.xmlCurrentStep = step;

            this.pushMsg({
                role: 'assistant',
                kind: 'info',
                content: `Generated ${step} fragment.\n\n${fragment.substring(0, 1200)}${fragment.length > 1200 ? '\n…snip…' : ''}`,
                latencyMs: latency,
                tokens: res.tokens ?? undefined
            });

            this.saveToStorage();
            this.scrollToBottomSoon();
        } catch (e: any) {
            this.xmlStepError = e?.message || String(e);
        } finally {
            this.isLoading = false;
        }
    }

    private renderXmlTemplate(parts: XmlParts): string {
        return `
<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="https://petriflow.com/petriflow.schema.xsd">
  <!-- HEADER_START -->
  ${parts.header ?? ''}
  <!-- HEADER_END -->

  <!-- ROLES_START -->
  ${parts.roles ?? ''}
  <!-- ROLES_END -->

  <!-- DATA_START -->
  ${parts.data ?? ''}
  <!-- DATA_END -->

  <!-- TRANSITIONS_START -->
  ${parts.transitions ?? ''}
  <!-- TRANSITIONS_END -->

  <!-- PLACES_START -->
  ${parts.places ?? ''}
  <!-- PLACES_END -->

  <!-- ARCS_START -->
  ${parts.arcs ?? ''}
  <!-- ARCS_END -->
</document>`.trim();
    }

    private systemPromptForFragments(): string {
        return [
            `You generate Petriflow XML FRAGMENTS for Netgrif Builder.`,
            `Output ONLY the requested tags (no markdown, no prose, no <document>).`,
            `Use simple, stable ids (snake_case or kebab_case).`,
            this.fewShotCache ? `\nFEW-SHOT EXAMPLES:\n${this.fewShotCache}\n` : ``,
        ].join('\n');
    }

    private buildIdRegistry(tech: TechSpec) {
        return {
            roles: [...tech.roles],
            data: tech.data.map(d => d.name),
            transitions: [...tech.workflow.transitions],
            places: [...tech.workflow.places],
            arcs: tech.workflow.arcs.map(a => ({ from: a.from, to: a.to })),
        };
    }

    private buildSectionPrompt(step: XmlStep, tech: TechSpec, currentSkeleton: string): string {
        const registry = this.buildIdRegistry(tech);
        const common = [
            `TECH_SPEC(JSON):`,
            JSON.stringify(tech, null, 2),
            ``,
            `ID_REGISTRY (use exactly these ids; do not invent new ids unless unavoidable for places_arcs):`,
            JSON.stringify(registry, null, 2),
            ``,
            `CURRENT_DOCUMENT_SKELETON (use markers to understand where content goes):`,
            this.sliceMiddle(currentSkeleton, 10000),
            ``,
        ].join('\n');

        switch (step) {
            case 'header':
                return [
                    common,
                    `TASK: Produce ONLY header-level elements.`,
                    `MUST include: <id>, <version>, <initials>, <title>Human Title</title>, <icon>, <defaultRole>, <anonymousRole>, <transitionRole>.`,
                    `Return ONLY header-level tags.`
                ].join('\n');

            case 'roles':
                return [
                    common,
                    `TASK: Produce ONLY <role> elements derived from TECH_SPEC.roles.`,
                    `FORMAT: <role><id>role_id</id><title>Human Role Title</title></role>`,
                    `Return ONLY <role> nodes.`
                ].join('\n');

            case 'data':
                return [
                    common,
                    `TASK: Produce ONLY <data> elements for all TECH_SPEC.data.`,
                    `Rules:`,
                    `- Each data MUST include <id> and <title>Human Title</title>.`,
                    `- Map required -> <logic><behavior>required</behavior></logic>.`,
                    `- Map enumValues -> <options><option key="...">...</option></options>.`,
                    `Return ONLY <data> nodes.`
                ].join('\n');

            case 'transitions':
                return [
                    common,
                    `TASK: Produce ONLY <transition> nodes (skeleton) for TECH_SPEC.workflow.transitions.`,
                    `Each transition MUST include:`,
                    `- <id> from ID_REGISTRY.transitions`,
                    `- <label>Human Title</label>`,
                    `- <x> and <y> coordinates`,
                    `- at least one <roleRef><id>one of ID_REGISTRY.roles</id><logic><perform>true</perform></logic></roleRef>`,
                    `- Inside body add these anchors exactly once:`,
                    `  <!-- INSERT_FORMS -->`,
                    `  <!-- INSERT_EVENTS -->`,
                    `Do NOT include <dataGroup> or <event> yet.`,
                    `Return ONLY transition nodes.`
                ].join('\n');

            case 'forms':
                return [
                    common,
                    `TASK: Produce ONLY the form fragments to be INSERTED into existing transitions.`,
                    `For each TECH_SPEC.forms item return exactly:`,
                    `<!-- FORM transitionId="<TRANSITION_ID>" -->`,
                    `<dataGroup>`,
                    `  <id>t_<TRANSITION_ID>_0</id>`,
                    `  <cols>4</cols>`,
                    `  <layout>grid</layout>`,
                    `  <!-- one dataRef per field, full structure -->`,
                    `  <dataRef>`,
                    `    <id><FIELD_ID></id>`,
                    `    <logic><behavior>visible</behavior></logic>`,
                    `    <layout><x>0</x><y>ROW_INDEX</y><rows>1</rows><cols>4</cols><template>material</template><appearance>outline</appearance></layout>`,
                    `  </dataRef>`,
                    `</dataGroup>`,
                    `<!-- END_FORM -->`,
                    `Use transition ids from ID_REGISTRY.transitions; data ids from ID_REGISTRY.data.`,
                    `Return ONLY these blocks.`
                ].join('\n');

            case 'events':
                return [
                    common,
                    `TASK: Produce ONLY event fragments to be inserted into transitions.`,
                    `Wrapper:`,
                    `<!-- EVENTS transitionId="<TRANSITION_ID>" -->`,
                    `<event type="finish"> ... </event>`,
                    `<!-- END_EVENTS -->`,
                    `Return ONLY these blocks.`
                ].join('\n');

            case 'places_arcs':
                return [
                    common,
                    `TASK: Produce ONLY <place> and <arc> elements to connect the Petri net.`,
                    `- Prefer place ids from ID_REGISTRY.places. If missing, create readable ids.`,
                    `- <arc> must reference existing <place> and <transition> ids.`,
                    `Return ONLY <place> and <arc> nodes.`
                ].join('\n');

            default:
                return common;
        }
    }

    private extractFragmentXml(text: string): string | null {
        const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/i);
        const candidate = (fenced ? fenced[1] : text).trim();
        if (!candidate) return null;
        if (!candidate.includes('<')) return null;
        return candidate;
    }

    private async applyFragment(step: XmlStep, fragment: string) {
        switch (step) {
            case 'header':
                this.xmlParts.header = fragment;
                break;
            case 'roles':
                // keep flags only in header
                this.xmlParts.roles = (fragment || '').replace(/<\/?\s*(defaultRole|anonymousRole|transitionRole)\s*>/gi, '');
                break;
            case 'data':
                this.xmlParts.data = fragment;
                break;
            case 'transitions':
                this.xmlParts.transitions = fragment;
                break;
            case 'forms':
                this.xmlParts.transitions = this.injectFormsIntoTransitions(this.xmlParts.transitions ?? '', fragment);
                break;
            case 'events':
                this.xmlParts.transitions = this.injectEventsIntoTransitions(this.xmlParts.transitions ?? '', fragment);
                break;
            case 'places_arcs': {
                const places = fragment.match(/<place\b[\s\S]*?<\/place>/gi)?.join('\n') ?? '';
                const arcs = fragment.match(/<arc\b[\s\S]*?<\/arc>/gi)?.join('\n') ?? '';
                if (places) this.xmlParts.places = places;
                if (arcs) this.xmlParts.arcs = arcs;
                break;
            }
        }
    }

    // ---------- Transition search/injection ----------
    private findTransitionBlock(xml: string, tid: string): { full: string; start: number; end: number; innerStart: number; innerEnd: number } | null {
        const re = /<transition\b[^>]*>([\s\S]*?)<\/transition>/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(xml)) !== null) {
            const full = m[0]; const inner = m[1];
            if (new RegExp(`<id>\\s*${this.escapeRegExp(tid)}\\s*<\\/id>`, 'i').test(inner)) {
                const start = m.index!;
                const end = start + full.length;
                const innerStart = start + full.indexOf(inner);
                const innerEnd = innerStart + inner.length;
                return { full, start, end, innerStart, innerEnd };
            }
        }
        return null;
    }

    private injectIntoTransitionBody(transitionsXml: string, tid: string, block: string): string {
        const hit = this.findTransitionBlock(transitionsXml, tid);
        if (!hit) return transitionsXml;
        const endTag = '</transition>';
        return transitionsXml.slice(0, hit.end - endTag.length)
            + `\n${block.trim()}\n`
            + transitionsXml.slice(hit.end - endTag.length);
    }

    private injectWithAnchor(transXml: string, tid: string, anchorComment: string, block: string): string {
        const hit = this.findTransitionBlock(transXml, tid);
        if (!hit) return transXml;
        const anchorRe = new RegExp(`<!--\\s*${this.escapeRegExp(anchorComment)}\\s*-->`, 'i');
        const inner = transXml.slice(hit.innerStart, hit.innerEnd);
        if (anchorRe.test(inner)) {
            const replacedInner = inner.replace(anchorRe, `<!-- ${anchorComment} -->\n${block.trim()}\n`);
            return transXml.slice(0, hit.innerStart) + replacedInner + transXml.slice(hit.innerEnd);
        }
        return this.injectIntoTransitionBody(transXml, tid, block);
    }

    private ensureDataGroupId(tid: string, block: string): string {
        // add id if missing
        return block.replace(/<dataGroup(\s[^>]*)?>/i, (m, attrs) => {
            if (attrs && /id\s*=/.test(attrs)) return m;
            return `<dataGroup id="dg_${tid}">`;
        });
    }

    private injectFormsIntoTransitions(transitionsXml: string, formsFragment: string): string {
        if (!transitionsXml) return transitionsXml;

        // ❶ upgrade na plnohodnotné grid skupiny (vnorené <id>, <cols>, <layout>…)
        const upgraded = this.upgradeFormFragmentsToGrid(formsFragment);

        // ❷ vlož na <!-- INSERT_FORMS --> v príslušnom transitione
        const blocks = this.matchAllCompat(
            upgraded,
            /<!--\s*FORM\s+transitionId="([^"]+)"\s*-->([\s\S]*?)<!--\s*END_FORM\s*-->/gi
        );
        if (!blocks.length) return transitionsXml;

        let out = transitionsXml;
        for (const b of blocks) {
            const tid = b[1];
            const group = b[2];
            out = this.injectWithAnchor(out, tid, 'INSERT_FORMS', group);
        }
        return out;
    }

    // ===== QUICK FIX: helpers to upgrade <dataGroup> to Builder grid style =====
    private parseDataRefIds(block: string): string[] {
        const ids: string[] = [];
        // <dataRef id="x" />
        for (const m of this.matchAllCompat(block, /<dataRef\s+id="([^"]+)"\s*\/?>/gi)) {
            ids.push(m[1]);
        }
        // <dataRef><id>x</id>...</dataRef>
        for (const m of this.matchAllCompat(block, /<dataRef\b[\s\S]*?<id>\s*([^<]+)\s*<\/id>[\s\S]*?<\/dataRef>/gi)) {
            ids.push(m[1]);
        }
        // de-dupe preserve order
        const seen = new Set<string>(); const out: string[] = [];
        for (const id of ids) { if (!seen.has(id)) { seen.add(id); out.push(id); } }
        return out;
    }

    private buildGridGroupForTransition(tid: string, fieldIds: string[]): string {
        const rows = fieldIds.map((fid, i) => `
    <dataRef>
      <id>${fid}</id>
      <logic>
        <behavior>visible</behavior>
      </logic>
      <layout>
        <x>0</x>
        <y>${i}</y>
        <rows>1</rows>
        <cols>4</cols>
        <template>material</template>
        <appearance>outline</appearance>
      </layout>
    </dataRef>`).join('');

        return `
  <dataGroup>
    <id>t_${tid}_0</id>
    <cols>4</cols>
    <layout>grid</layout>${rows}
  </dataGroup>`.trim();
    }

    /** Convert any minimal FORM blocks to full grid dataGroups Builder likes. */
    private upgradeFormFragmentsToGrid(formsFragment: string): string {
        const blocks = this.matchAllCompat(
            formsFragment,
            /<!--\s*FORM\s+transitionId="([^"]+)"\s*-->([\s\S]*?)<!--\s*END_FORM\s*-->/gi
        );
        if (!blocks.length) return formsFragment;

        let out = formsFragment;
        for (const b of blocks) {
            const tid = b[1];
            const inner = b[2];
            const fieldIds = this.parseDataRefIds(inner);
            const gridGroup = this.buildGridGroupForTransition(tid, fieldIds);
            const replacement = `<!-- FORM transitionId="${tid}" -->\n${gridGroup}\n<!-- END_FORM -->`;
            out = out.replace(b[0], replacement);
        }
        return out;
    }

    private injectEventsIntoTransitions(transitionsXml: string, eventsFragment: string): string {
        if (!transitionsXml) return transitionsXml;

        const blocks = this.matchAllCompat(
            eventsFragment,
            /<!--\s*EVENTS\s+transitionId="([^"]+)"\s*-->([\s\S]*?)<!--\s*END_EVENTS\s*-->/gi
        );
        if (!blocks.length) return transitionsXml;

        let out = transitionsXml;
        for (const b of blocks) {
            const tid = b[1];
            const group = b[2];
            out = this.injectWithAnchor(out, tid, 'INSERT_EVENTS', group);
        }
        return out;
    }

    /** Final assembly + normalization for Builder friendliness. */
    private async assembleFinalXml() {
        let finalDoc = this.renderXmlTemplate(this.xmlParts);
        finalDoc = this.normalizeXml(finalDoc);

        const summary = this.summarizeXml(finalDoc) || 'Proposed XML (wizard)';
        this.pushMsg({ role: 'assistant', kind: 'xml', content: '', xml: finalDoc, summary });

        this.state.lastXml = finalDoc;
        this.saveToStorage();
        this.scrollToBottomSoon();
    }

    /** ---------- Normalizer: adds coords, ids, dedup arcs, cleans anchors ---------- */
    private normalizeXml(xml: string): string {
        let out = xml;

        // 1) Ensure every <dataGroup> has an id
        out = out.replace(/<dataGroup(\s*?)>/gi, `<dataGroup id="dg_auto">$1>`);

        // 2) Ensure transitions have <x>/<y> and <label>…</label>
        const transBlocks: RegExpExecArray[] = this.matchAllCompat(out, /<transition\b[^>]*>[\s\S]*?<\/transition>/gi);
        let idx = 0;
        for (const tb of transBlocks) {
            const block = tb[0];
            const idm = block.match(/<id>\s*([^<]+)\s*<\/id>/i);
            const tid = (idm?.[1] || `t${idx+1}`).trim();

            let newBlock = block;

            // label
            if (!/<label>[\s\S]*?<text[\s\S]*?<\/text>[\s\S]*?<\/label>/i.test(newBlock)) {
                const title = this.titleCaseFromId(tid);
                newBlock = newBlock.replace(/<id>[\s\S]*?<\/id>/i, (m) => `${m}\n\t<label>${title}</label>`);
            }

            // coords
            if (!/<x>[\s\S]*?<\/x>/i.test(newBlock) || !/<y>[\s\S]*?<\/y>/i.test(newBlock)) {
                const x = 200 + (idx * 220);
                const y = 140 + ((idx % 4) * 120);
                // insert after label if present, else after id
                if (/<label>/.test(newBlock)) {
                    newBlock = newBlock.replace(/<\/label>/i, `</label>\n\t<x>${x}</x>\n\t<y>${y}</y>`);
                } else {
                    newBlock = newBlock.replace(/<id>[\s\S]*?<\/id>/i, (m) => `${m}\n\t<x>${x}</x>\n\t<y>${y}</y>`);
                }
            }

            // remove duplicated anchors if any
            newBlock = newBlock.replace(/<!--\s*INSERT_FORMS\s*-->/gi, '<!-- INSERT_FORMS -->');
            newBlock = newBlock.replace(/<!--\s*INSERT_EVENTS\s*-->/gi, '<!-- INSERT_EVENTS -->');

            out = out.replace(block, newBlock);
            idx++;
        }

        // 3) Deduplicate arcs (sourceId+destinationId)
        const arcs: RegExpExecArray[] = this.matchAllCompat(out, /<arc>\s*[\s\S]*?<\/arc>/gi);
        const seen = new Set<string>();
        for (const a of arcs) {
            const blk = a[0];
            const s = blk.match(/<sourceId>\s*([^<]+)\s*<\/sourceId>/i)?.[1]?.trim() ?? '';
            const d = blk.match(/<destinationId>\s*([^<]+)\s*<\/destinationId>/i)?.[1]?.trim() ?? '';
            const key = `${s}>${d}`;
            if (s && d) {
                if (seen.has(key)) {
                    out = out.replace(blk, '');
                } else {
                    seen.add(key);
                }
            }
        }

        // 4) Remove stray empty groups/comments left over
        out = out.replace(/<dataGroup\s+id="dg_auto">\s*<\/dataGroup>/gi, '');
        out = out.replace(/<!--\s*INSERT_FORMS\s*-->\s*<!--\s*INSERT_EVENTS\s*-->/gi, '<!-- INSERT_FORMS -->\n<!-- INSERT_EVENTS -->');

        return out;
    }

    private titleCaseFromId(id: string): string {
        return id
            .replace(/[_\-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (m) => m.toUpperCase());
    }

    // ====== small helpers ======
    private escapeRegExp(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    private matchAllCompat(s: string, rex: RegExp): RegExpExecArray[] {
        const flags = rex.flags.indexOf('g') === -1 ? rex.flags + 'g' : rex.flags;
        const r = new RegExp(rex.source, flags);
        const out: RegExpExecArray[] = [];
        let m: RegExpExecArray | null;
        while ((m = r.exec(s)) !== null) {
            out.push(m);
            if (m.index === r.lastIndex) r.lastIndex++;
        }
        return out;
    }
}
