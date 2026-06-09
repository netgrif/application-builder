import {Injectable, NgZone} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ReplaySubject, Subscription} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {AiProviderService} from './ai-provider.service';
import {ModelService} from '../model/model.service';
import {ModelExportService} from '../model/model-export.service';
import {ModelImportService} from '../../model-import-service';
import {MessageHelperService} from './message-helper.service';
import {AiChatMessage, ChatTurn} from './domain/message-objects';
import {PETRIFLOW_REFERENCE, PETRIFLOW_SYSTEM_PROMPT} from './generated-petriflow-prompts';
import {
    Action,
    DataGroup,
    DataRef,
    DataType,
    DataVariable,
    EventPhase,
    I18nString,
    PetriNet,
    Role,
    Transition,
    TransitionEvent,
    TransitionEventType,
    TransitionPermissionRef,
} from '@netgrif/petriflow';
import {HistoryService} from '../history/history.service';
import {BpmnStateService} from '../../bpmn-mode/bpmn-state.service';
import {EnrichmentService} from '../../bpmn-mode/enrichment.service';
import {transitionIdToActivityKey} from '../../bpmn-mode/bpmn-conversion.util';

// Public enums — kept for compatibility with master-detail / data / role / action
// modes that pass an "AI context hint" when opening the sidenav. The hint is now
// embedded as a user-message preface rather than driving a state machine.
export enum AiAssistantContextEnum {
    DATA_LOCAL    = 'Selected Data',
    DATA_GLOBAL   = 'All Data',
    ROLES_LOCAL   = 'Selected Role',
    ROLES_GLOBAL  = 'All Roles',
    ACTION_LOCAL  = 'Selected Action',
    ACTION_GLOBAL = 'All Actions',
    FORM_BUILDER  = 'Current Form'
}

export enum AiAssistantActionContextEnum {
    DATA         = 'Data Variable',
    TRANSITION   = 'Transition',
    ROLE         = 'Role',
    PROCESS_CASE = 'Process and Case'
}

export interface AiAssistantCurrentContext {
    isGlobal: boolean;
    localContext: LocalContext;
}

export interface LocalContext {
    currentContext: AiAssistantContextEnum | null;
    actionContext:  AiAssistantActionContextEnum | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contextObject:  any;
}

const HISTORY_STORAGE_KEY = 'nab.ai.history';

/**
 * Appended to the system prompt. Lets the model answer a small, targeted edit to
 * the ALREADY-OPEN process with a compact JSON patch instead of re-emitting the
 * whole document — faster, cheaper and with no risk of drifting other parts.
 */
const PATCH_PROTOCOL = `# Targeted edits (PATCH mode)

When the user asks for a SMALL, targeted change to the process that is ALREADY open
(rename a task, add a role, assign a permission, add a form field, add an action),
do NOT re-emit the whole document. Return a single fenced \`\`\`json block of the form:

{"ops": [ /* one or more operations */ ]}

Supported operations — always reference EXISTING element ids from the process you were given:
- {"op":"setLabel","task":"<transitionId>","value":"New label"}
- {"op":"addRole","id":"approver","title":"Approver"}
- {"op":"assignRole","task":"<transitionId>","role":"<roleId>","permissions":["perform","view"]}
- {"op":"addField","id":"reason","type":"text","title":"Reason","task":"<transitionId>"}
      type is one of: text, number, boolean, date, dateTime, enumeration, file, user.
      "task" is optional; when present the field is also placed on that task's form.
- {"op":"addAction","task":"<transitionId>","trigger":"finish","definition":"<petriflow action body>"}
      trigger is one of: assign, finish, cancel, delegate.

Rules:
- Prefer a PATCH for incremental edits. Use a full <document> XML only for a brand-new
  process or a STRUCTURAL change (adding/removing tasks, transitions or arcs).
- Keep all existing ids unchanged. Reference tasks by their transition id.
- Return EITHER a json patch OR an xml document in a single reply — never both.`;

/**
 * Drives the chat-style AI assistant in the modeler.
 *
 *   user prompt
 *     → optionally prefaced with current canvas XML
 *     → appended to conversationHistory
 *     → sent to active provider with system_prompt.md + petriflow_reference.md
 *     → streamed text chunks update the last assistant bubble in real time
 *     → if final answer contains an ```xml ... ``` block, an "Apply / Download" row is appended
 *
 * The intent (chat vs generate) is decided by the model based on system_prompt.md.
 * No client-side state machine.
 */
@Injectable({
    providedIn: 'root'
})
export class AiAssistantService {

    public assistantContext: AiAssistantCurrentContext;
    public messages$: ReplaySubject<AiChatMessage[]> = new ReplaySubject(1);

    /** In-memory conversation history sent to the provider (text only, no UI noise). */
    private conversationHistory: ChatTurn[] = [];
    /** UI representation of the conversation (text bubbles, spinners, action buttons). */
    private uiMessages: AiChatMessage[] = [];

    private systemPromptCache: string | null = null;
    private nextMessageId = 1;

    /** Subscription to the currently streaming provider response, or null when idle. */
    private currentStreamSub: Subscription | null = null;
    private currentStreamStopped = false;

    constructor(
        private aiProvider: AiProviderService,
        private messageHelper: MessageHelperService,
        private modelService: ModelService,
        private exportService: ModelExportService,
        private importService: ModelImportService,
        private bpmnState: BpmnStateService,
        private enrichment: EnrichmentService,
        private history: HistoryService,
        private http: HttpClient,
        private zone: NgZone
    ) {
        this.assistantContext = {
            isGlobal: true,
            localContext: {
                currentContext: null,
                actionContext: null,
                contextObject: null
            }
        };

        this.restoreHistory();

        if (!this.aiProvider.getActiveProvider()) {
            this.aiProvider.setActiveProvider(environment.ai.defaultProvider);
        }
        if (!this.aiProvider.getActiveModel()) {
            const p = this.aiProvider.getActiveProvider();
            this.aiProvider.setActiveModel(environment.ai.defaultModels[p]);
        }
    }

    // ─── Public API used by the chat component ───────────────────────────────

    public isAiConfigured(): boolean {
        return this.aiProvider.hasKeyForActiveProvider();
    }

    /** True when the current process originates from an imported BPMN diagram. */
    public isBpmnProject(): boolean {
        return this.bpmnState.isBpmnProject;
    }

    public configureAiAssistant(cfg: {provider: 'claude' | 'openai' | 'gemini'; model: string; keys: {claude?: string; openai?: string; gemini?: string}}): void {
        this.aiProvider.configure(cfg.provider, cfg.model, cfg.keys);
    }

    public getCurrentProvider(): string {
        return this.aiProvider.getActiveProvider() || environment.ai.defaultProvider;
    }

    public getCurrentModel(): string {
        return this.aiProvider.getActiveModel() || environment.ai.defaultModels[this.getCurrentProvider() as 'claude' | 'openai' | 'gemini'];
    }

    public setActiveModel(model: string): void {
        this.aiProvider.setActiveModel(model);
    }

    public setActiveProvider(provider: 'claude' | 'openai' | 'gemini'): void {
        this.aiProvider.setActiveProvider(provider);
        const models = environment.ai.availableModels[provider].map(m => m.id);
        if (!models.includes(this.getCurrentModel())) {
            this.aiProvider.setActiveModel(environment.ai.defaultModels[provider]);
        }
    }

    public getStoredKeys() {
        return this.aiProvider.getKeys();
    }

    /**
     * Sends a user message and streams the reply.
     * Bubble updates happen inside NgZone so change detection picks them up.
     */
    public async sendUserMessage(text: string): Promise<AiChatMessage[]> {
        const canvas = this.getCurrentModelAsString();
        // For a BPMN-derived process only the enrichment layer (forms/roles/
        // actions/data) can be applied back; the workflow structure is owned by
        // the BPMN diagram. Steer the model to enrichment-only edits that keep
        // every transition/place id intact so they re-attach after conversion.
        const bpmnGuard = this.bpmnState.isBpmnProject
            ? `[This process originates from a BPMN diagram. Modify ONLY forms, roles, actions and data variables. Do NOT change the workflow structure (places/transitions/arcs) and keep every transition and place id exactly as given.]\n\n`
            : '';
        const turnContent = canvas
            ? `${bpmnGuard}[Current process open in the user's visual editor — treat this as up-to-date context for the question that follows.]\n\n\`\`\`xml\n${canvas.trim()}\n\`\`\`\n\n${text}`
            : `${bpmnGuard}${text}`;

        // User bubble.
        this.pushMessage(this.makeMessage('text', text, false));

        // Thinking spinner — removed when the first token arrives or on error.
        const spinner = this.makeMessage('spinner', 'Thinking…', true);
        this.pushMessage(spinner);

        this.conversationHistory.push({role: 'user', content: turnContent});

        this.currentStreamStopped = false;

        try {
            const systemPrompt = await this.loadSystemPrompt();
            const fullText = await new Promise<string>((resolve, reject) => {
                let acc = '';
                let assistantBubbleId: number | null = null;

                this.currentStreamSub = this.aiProvider.stream(this.conversationHistory, systemPrompt).subscribe({
                    next: chunk => {
                        this.zone.run(() => {
                            acc += chunk;
                            if (assistantBubbleId === null) {
                                // First token: replace the spinner with a streaming bubble.
                                this.removeMessageById(spinner.id!);
                                const bubble = this.makeMessage('text', acc, true);
                                assistantBubbleId = bubble.id!;
                                this.pushMessage(bubble);
                            } else {
                                this.replaceMessageText(assistantBubbleId, acc);
                            }
                        });
                    },
                    error: err => this.zone.run(() => reject(err)),
                    complete: () => this.zone.run(() => resolve(acc))
                });
            });

            this.currentStreamSub = null;

            // If stream finished but nothing arrived (provider returned empty), drop the spinner.
            this.removeMessageById(spinner.id!);

            // When user stopped the stream we keep the partial reply visible but
            // skip persisting / extracting XML, since the response is incomplete.
            if (this.currentStreamStopped) {
                this.currentStreamStopped = false;
                return this.uiMessages;
            }

            this.conversationHistory.push({role: 'assistant', content: fullText});
            this.persistHistory();

            const xml = this.extractXmlBlock(fullText);
            if (xml) {
                // Attach apply/download actions to the bubble that contains the XML.
                this.pushMessage(this.makeMessage('xml-actions', xml, true));
                this.emitMessages();
            } else {
                // No full document — maybe a targeted PATCH (JSON ops) for the open process.
                const patch = this.extractPatchBlock(fullText);
                if (patch) {
                    this.pushMessage(this.makeMessage('patch-actions', patch, true));
                    this.emitMessages();
                }
            }
        } catch (err) {
            this.currentStreamSub = null;
            this.zone.run(() => {
                this.removeMessageById(spinner.id!);
                this.pushMessage(this.makeMessage('error', this.extractErrorMessage(err), true));
            });
        }

        return this.uiMessages;
    }

    /**
     * Streams a pre-prepared response (e.g. a mockup XML) into the chat
     * **without calling any provider**. The chat looks identical to a real
     * generation — same spinner → token-by-token bubble → XML actions card —
     * but every byte comes from the bundled text, so it works offline and
     * never burns API quota.
     *
     * Used by "FREE MOCKUP" example chips.
     */
    public async sendMockup(opts: {
        userPrompt: string;
        intro: string;
        xml: string;
        /** ms between chunks; lower = faster typing animation. */
        chunkDelayMs?: number;
    }): Promise<AiChatMessage[]> {
        const {userPrompt, intro, xml} = opts;
        const chunkDelayMs = opts.chunkDelayMs ?? 12;

        // User bubble.
        this.pushMessage(this.makeMessage('text', userPrompt, false));
        const spinner = this.makeMessage('spinner', 'Thinking…', true);
        this.pushMessage(spinner);

        // Build the final assistant reply.
        const body = `${intro.trim()}\n\n\`\`\`xml\n${xml.trim()}\n\`\`\``;

        // Simulate streaming so it feels live.
        let acc = '';
        let bubbleId: number | null = null;
        // Tokenize roughly: word chunks for prose, larger chunks for XML.
        const tokens = body.match(/[\s\S]{1,40}/g) ?? [body];

        this.currentStreamStopped = false;
        // Mark stream as "active" so the Stop button shows up; we use a sentinel sub.
        this.currentStreamSub = new Subscription();

        for (const tok of tokens) {
            if (this.currentStreamStopped) break;
            await new Promise(r => setTimeout(r, chunkDelayMs));
            this.zone.run(() => {
                acc += tok;
                if (bubbleId === null) {
                    this.removeMessageById(spinner.id!);
                    const bubble = this.makeMessage('text', acc, true);
                    bubbleId = bubble.id!;
                    this.pushMessage(bubble);
                } else {
                    this.replaceMessageText(bubbleId, acc);
                }
            });
        }

        // Ensure spinner gone even if we stopped before first chunk.
        this.removeMessageById(spinner.id!);
        this.currentStreamSub = null;

        if (!this.currentStreamStopped) {
            // Mockups still get an Apply / Download row.
            this.pushMessage(this.makeMessage('xml-actions', xml.trim(), true));
            this.emitMessages();
        }
        this.currentStreamStopped = false;
        return this.uiMessages;
    }

    /**
     * Robust error-to-string. Plain objects (HttpErrorResponse, fetch errors
     * from non-Error throws, etc.) would otherwise render as "[object Object]".
     */
    private extractErrorMessage(err: unknown): string {
        if (err == null) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (err instanceof Error) return err.message || err.name || 'Error';
        if (typeof err === 'object') {
            const e = err as Record<string, any>;
            const msg =
                e.message ||
                e.error?.message ||
                (typeof e.error === 'string' ? e.error : null) ||
                e.statusText ||
                e.reason;
            if (msg) return String(msg);
            try {
                return JSON.stringify(err);
            } catch {
                return 'Unknown error';
            }
        }
        return String(err);
    }

    /** True while a provider response is being streamed and can still be cancelled. */
    public isStreaming(): boolean {
        return this.currentStreamSub !== null;
    }

    /**
     * Cancels the in-flight provider stream. Any partial reply already rendered
     * stays in the conversation so the user keeps what they saw, but it is not
     * sent back to the provider on the next turn.
     */
    public stopStreaming(): void {
        if (!this.currentStreamSub) return;
        this.currentStreamStopped = true;
        this.currentStreamSub.unsubscribe();
        this.currentStreamSub = null;
    }

    /**
     * Apply XML to the canvas. If parsing fails, the bubble stays so the user can still copy / download.
     *
     * For a BPMN-originated process the workflow structure lives in the BPMN
     * diagram and the model is rebuilt on every conversion — so the AI's changes
     * would be overwritten unless we harvest them into the enrichment store
     * (per-task forms/roles/actions + process-global roles/data), exactly like
     * the BPMN editor does on re-entry. Structural changes the AI may have made
     * cannot be reflected back into the diagram; we report that so the caller can
     * warn the user.
     */
    public applyXmlString(xml: string): {ok: boolean; error?: string; structuralChange?: boolean} {
        const isBpmn = this.bpmnState.isBpmnProject;
        const before = isBpmn ? this.structureSignature(this.modelService.model) : '';
        try {
            this.importService.importFromXml(xml);
        } catch (e) {
            return {ok: false, error: e instanceof Error ? e.message : String(e)};
        }
        if (!isBpmn) {
            return {ok: true};
        }
        const structuralChange = this.structureSignature(this.modelService.model) !== before;
        // Capture the just-applied forms/roles/actions/data so they survive the
        // next BPMN→Petriflow conversion (overlaid by EnrichmentService.materializeInto).
        this.enrichment.harvestAll(this.modelService.model);
        // Task labels are the BPMN element's name — the diagram, not the enrichment
        // store, is their source of truth (materializeInto deliberately skips labels).
        // Stash the AI's labels so BpmnModeComponent writes them onto the diagram.
        const labels = new Map<string, string>();
        this.modelService.model.getTransitions().forEach(t => {
            const label = t.label?.value;
            if (label != null) labels.set(transitionIdToActivityKey(t.id), label);
        });
        this.bpmnState.pendingLabelOverrides = labels;
        return {ok: true, structuralChange};
    }

    /** Structural fingerprint of a net (places + transitions + arcs), id-based. */
    private structureSignature(model: PetriNet | undefined): string {
        if (!model) return '';
        const places = model.getPlaces().map(p => p.id).sort();
        const transitions = model.getTransitions().map(t => t.id).sort();
        const arcs = model.getArcs()
            .map(a => `${a.source?.id}->${a.destination?.id}:${a.type}`)
            .sort();
        return JSON.stringify({places, transitions, arcs});
    }

    // ─── Patch / ops mode ────────────────────────────────────────────────────

    /**
     * Apply a targeted JSON patch ({"ops":[...]}) to the open process instead of
     * replacing the whole model. Mutates the live model in place, records history,
     * and — for a BPMN project — harvests enrichment and pushes label changes onto
     * the diagram, exactly like {@link applyXmlString}.
     */
    public applyPatchString(json: string): {ok: boolean; error?: string; applied?: number; failed?: number; structuralChange?: boolean} {
        const model = this.modelService.model;
        if (!model) return {ok: false, error: 'No process is open.'};

        let ops: unknown[];
        try {
            const parsed = JSON.parse(json);
            ops = Array.isArray(parsed) ? parsed : (parsed?.ops as unknown[]);
            if (!Array.isArray(ops)) throw new Error('missing ops array');
        } catch {
            return {ok: false, error: 'Patch is not valid JSON.'};
        }

        let applied = 0, failed = 0;
        for (const op of ops) {
            try {
                if (this.applyOp(model, op as Record<string, any>)) applied++; else failed++;
            } catch {
                failed++;
            }
        }
        if (applied === 0) return {ok: false, error: 'No operations could be applied.'};

        // Re-emit so all modeler views refresh, and make the change undoable.
        this.modelService.model = model;
        this.history.save('AI applied targeted changes.');

        if (this.bpmnState.isBpmnProject) {
            this.enrichment.harvestAll(model);
            const labels = new Map<string, string>();
            model.getTransitions().forEach(t => {
                const label = t.label?.value;
                if (label != null) labels.set(transitionIdToActivityKey(t.id), label);
            });
            this.bpmnState.pendingLabelOverrides = labels;
        }
        return {ok: true, applied, failed, structuralChange: false};
    }

    /** Find a transition by its id or by its BPMN activity key. */
    private resolveTransition(model: PetriNet, task: string): Transition | undefined {
        if (!task) return undefined;
        return model.getTransition(task)
            ?? model.getTransitions().find(t => transitionIdToActivityKey(t.id) === task);
    }

    /** Dispatch a single patch operation. Returns true when it changed the model. */
    private applyOp(model: PetriNet, op: Record<string, any>): boolean {
        switch (op?.op) {
            case 'setLabel':   return this.opSetLabel(model, op);
            case 'addRole':    return this.opAddRole(model, op);
            case 'assignRole': return this.opAssignRole(model, op);
            case 'addField':   return this.opAddField(model, op);
            case 'addAction':  return this.opAddAction(model, op);
            default:           return false;
        }
    }

    private opSetLabel(model: PetriNet, op: Record<string, any>): boolean {
        const t = this.resolveTransition(model, op.task);
        if (!t) return false;
        t.label = new I18nString(String(op.value ?? ''));
        return true;
    }

    private opAddRole(model: PetriNet, op: Record<string, any>): boolean {
        const id = op.id || this.modelService.nextRoleId();
        const title = new I18nString(op.title ?? id);
        const existing = model.getRole(id);
        if (existing) { existing.title = title; return true; }
        const role = new Role(id);
        role.title = title;
        model.addRole(role);
        return true;
    }

    private opAssignRole(model: PetriNet, op: Record<string, any>): boolean {
        const t = this.resolveTransition(model, op.task);
        const roleId = op.role;
        if (!t || !roleId) return false;
        if (!model.getRole(roleId)) {
            const role = new Role(roleId);
            role.title = new I18nString(roleId);
            model.addRole(role);
        }
        let ref = t.roleRefs.find(r => r.id === roleId);
        if (!ref) { ref = new TransitionPermissionRef(roleId); t.roleRefs.push(ref); }
        const perms: string[] = Array.isArray(op.permissions) ? op.permissions : ['perform', 'view'];
        if (perms.includes('perform'))  ref.logic.perform = true;
        if (perms.includes('view'))     ref.logic.view = true;
        if (perms.includes('assign'))   ref.logic.assign = true;
        if (perms.includes('cancel'))   ref.logic.cancel = true;
        if (perms.includes('delegate')) ref.logic.delegate = true;
        return true;
    }

    private opAddField(model: PetriNet, op: Record<string, any>): boolean {
        const id = op.id || this.modelService.nextDataId();
        const type = this.toDataType(op.type);
        let data = model.getData(id);
        if (!data) { data = new DataVariable(id, type); model.addData(data); }
        data.type = type;
        data.title = new I18nString(op.title ?? id);
        if (op.task) {
            const t = this.resolveTransition(model, op.task);
            if (t) {
                let group = t.dataGroups[0];
                if (!group) { group = new DataGroup(`${t.id}_form`); t.dataGroups.push(group); }
                if (!group.getDataRef(id)) group.addDataRef(new DataRef(id));
            }
        }
        return true;
    }

    private opAddAction(model: PetriNet, op: Record<string, any>): boolean {
        const t = this.resolveTransition(model, op.task);
        const definition = String(op.definition ?? '').trim();
        if (!t || !definition) return false;
        const type = this.toTransitionEventType(op.trigger);
        let event = t.eventSource.getEvent(type);
        if (!event) { event = new TransitionEvent(type, `${t.id}_${type}`); t.eventSource.addEvent(event); }
        event.addAction(new Action(this.modelService.nextActionId(), definition), EventPhase.POST);
        return true;
    }

    private toDataType(value: unknown): DataType {
        const key = String(value ?? 'text').toLowerCase();
        const map: Record<string, DataType> = {
            text: DataType.TEXT, number: DataType.NUMBER, boolean: DataType.BOOLEAN,
            date: DataType.DATE, datetime: DataType.DATETIME, enumeration: DataType.ENUMERATION,
            file: DataType.FILE, user: DataType.USER,
        };
        return map[key] ?? DataType.TEXT;
    }

    private toTransitionEventType(value: unknown): TransitionEventType {
        switch (String(value ?? 'finish').toLowerCase()) {
            case 'assign':   return TransitionEventType.ASSIGN;
            case 'cancel':   return TransitionEventType.CANCEL;
            case 'delegate': return TransitionEventType.DELEGATE;
            default:         return TransitionEventType.FINISH;
        }
    }

    /** Extract a JSON patch ({"ops":[...]}) from the model reply, if present. */
    private extractPatchBlock(text: string): string | null {
        if (!text) return null;
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fenced ? fenced[1] : (text.trim().startsWith('{') ? text.trim() : null);
        if (!candidate) return null;
        try {
            const obj = JSON.parse(candidate.trim());
            if (obj && Array.isArray(obj.ops) && obj.ops.length > 0) return JSON.stringify(obj);
        } catch { /* not a json patch */ }
        return null;
    }

    /** Forget everything — clear local history, clear UI bubbles, drop persisted state. */
    public resetAgent(): void {
        this.conversationHistory = [];
        this.uiMessages = [];
        this.persistHistory();
        this.emitMessages();
    }

    public getUiMessages(): AiChatMessage[] {
        return this.uiMessages;
    }

    public cloneContext(c: AiAssistantCurrentContext): AiAssistantCurrentContext {
        return {
            isGlobal: c.isGlobal,
            localContext: {
                currentContext: c.localContext.currentContext,
                actionContext:  c.localContext.actionContext,
                contextObject:  c.localContext.contextObject ? {...c.localContext.contextObject} : null
            }
        };
    }

    // ─── Internal helpers ────────────────────────────────────────────────────

    private makeMessage(
        type: AiChatMessage['type'],
        text: string,
        reply: boolean
    ): AiChatMessage {
        return {
            id: this.nextMessageId++,
            type,
            text,
            reply,
            date: new Date(),
            applicationContext: this.cloneContext(this.assistantContext)
        };
    }

    private pushMessage(msg: AiChatMessage): void {
        this.uiMessages = [...this.uiMessages, msg];
        this.emitMessages();
    }

    private replaceMessageText(id: number, text: string): void {
        this.uiMessages = this.uiMessages.map(m =>
            m.id === id ? {...m, text} : m
        );
        this.emitMessages();
    }

    private removeMessageById(id: number): void {
        this.uiMessages = this.uiMessages.filter(m => m.id !== id);
        this.emitMessages();
    }

    private async loadSystemPrompt(): Promise<string> {
        if (this.systemPromptCache) {
            return this.systemPromptCache;
        }
        // Prompt + reference are baked into the JS bundle at build time
        // (see scripts/embed-petriflow-prompts.js).
        this.systemPromptCache = `${PETRIFLOW_SYSTEM_PROMPT.trim()}\n\n---\n\n# Petriflow Reference\n\n${PETRIFLOW_REFERENCE}\n\n---\n\n${PATCH_PROTOCOL}`;
        return this.systemPromptCache;
    }

    private getCurrentModelAsString(): string {
        try {
            if (this.modelService?.model) {
                return this.exportService.exportXml(this.modelService.model) || '';
            }
        } catch (e) {
            console.warn('Failed to export current model as XML', e);
        }
        return '';
    }

    private extractXmlBlock(text: string): string | null {
        if (!text) return null;
        const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/i);
        if (fenced && /<document[\s>]/i.test(fenced[1])) return fenced[1].trim();
        if (/<document[\s>]/i.test(text)) {
            const start = text.indexOf('<document');
            const end = text.lastIndexOf('</document>');
            if (start >= 0 && end > start) return text.slice(start, end + '</document>'.length);
        }
        return null;
    }

    private emitMessages(): void {
        this.messages$.next(this.uiMessages);
    }

    private persistHistory(): void {
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.conversationHistory));
        } catch {
            // best effort
        }
    }

    private restoreHistory(): void {
        try {
            const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (raw) this.conversationHistory = JSON.parse(raw);
        } catch {
            this.conversationHistory = [];
        }
    }
}
