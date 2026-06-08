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
        const turnContent = canvas
            ? `[Current process open in the user's visual editor — treat this as up-to-date context for the question that follows.]\n\n\`\`\`xml\n${canvas.trim()}\n\`\`\`\n\n${text}`
            : text;

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

    /** Apply XML to the canvas. If parsing fails, the bubble stays so the user can still copy / download. */
    public applyXmlString(xml: string): {ok: boolean; error?: string} {
        try {
            this.importService.importFromXml(xml);
            return {ok: true};
        } catch (e) {
            return {ok: false, error: e instanceof Error ? e.message : String(e)};
        }
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
        this.systemPromptCache = `${PETRIFLOW_SYSTEM_PROMPT.trim()}\n\n---\n\n# Petriflow Reference\n\n${PETRIFLOW_REFERENCE}`;
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
