import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {AiAssistantService} from '../../services/ai-assistant/ai-assistant.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {FormsModule} from '@angular/forms';
import {MatButton, MatFabButton, MatIconButton, MatMiniFabButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {CovalentMarkdownModule} from '@covalent/markdown';
import {ViewHelperService} from '../../services/ai-assistant/view-helper.service';
import {Subscription} from 'rxjs';
import {MatTooltip} from '@angular/material/tooltip';
import {MatDialog} from '@angular/material/dialog';
import {DialogConfigureAiComponent} from '../../../dialogs/dialog-configure-ai/dialog-configure-ai.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AiChatMessage} from '../../services/ai-assistant/domain/message-objects';
import {environment} from '../../../../environments/environment';

/**
 * Example shown on the welcome screen. Two kinds:
 *  - `prompt`: drops the text into the composer for the user to send to the AI.
 *  - `mockup`: pre-baked XML streamed locally — no API call, no quota, never fails.
 *    Equivalent to the old "FREE MOCKUP" chips in the previous generator.
 */
export interface QuickExample {
    kind: 'prompt' | 'mockup';
    label: string;
    description?: string;
    /** for 'prompt': the text we drop into the composer */
    prompt?: string;
    /** for 'mockup': URL to the bundled XML and an intro shown above it */
    mockupXmlUrl?: string;
    mockupIntro?: string;
    /** what the user message bubble should say when the mockup is fired */
    mockupUserPrompt?: string;
}

/**
 * AI Builder Agent chat view — handles messaging, streaming display, XML actions,
 * provider configuration, and smart scroll behaviour.
 */
@Component({
    selector: 'nab-ai-chat-component',
    standalone: true,
    imports: [
        NgForOf,
        MatProgressSpinner,
        FormsModule,
        DatePipe,
        NgClass,
        NgIf,
        MatButton,
        MatIcon,
        MatFabButton,
        MatMiniFabButton,
        CovalentMarkdownModule,
        MatIconButton,
        MatTooltip
    ],
    templateUrl: './ai-chat-component.component.html',
    styleUrl: './ai-chat-component.component.scss'
})
export class AiChatComponentComponent implements OnDestroy {

    @ViewChild('chatMessages') private chatMessages: ElementRef;
    @ViewChild('messageInput')  private messageInput: ElementRef;

    private scrollSubscription: Subscription;
    private messageSubscription: Subscription;

    public messages: AiChatMessage[] = [];
    public loading: boolean = false;
    public currentMessage: string = '';

    /** Per-bubble UI state (full XML expanded / collapsed). Keyed by message id. */
    public xmlExpanded: Record<number, boolean> = {};

    /** True when user scrolled up — disables auto-scroll, shows jump-to-bottom FAB. */
    public showScrollFab = false;
    private userIsAtBottom = true;

    /**
     * Welcome-screen examples. The first two are FREE MOCKUPS — streamed
     * locally from bundled XML so anyone (including users without an API key)
     * can see a finished result instantly. The rest are conventional prompts
     * that get sent to the configured provider.
     */
    public quickExamples: QuickExample[] = [
        {
            kind: 'mockup',
            label: '📋 Public Request & Response',
            description: 'Public-facing eForm, no login. Routed via Legal then answered by PR.',
            mockupXmlUrl: 'assets/mockups/public_request_response.xml',
            mockupUserPrompt: 'Model a public request & response process — anonymous submission, optional Legal review, PR response, persistent public status view.',
            mockupIntro: 'Here\'s a complete public request & response process. Anyone can submit via the public form without an account; the registration desk routes it to Legal or directly to PR. Legal writes a mandatory statement if involved, PR writes the final answer, and the submitter can re-check the status any time via the persistent public link.'
        },
        {
            kind: 'mockup',
            label: '🌴 HR Leave Request',
            description: 'Two-level approval — manager then HR. Rejections loop back with email.',
            // Falls back to a normal prompt if the XML file is not present yet.
            mockupXmlUrl: 'assets/mockups/hr_leave_request.xml',
            mockupUserPrompt: 'Model an HR leave request — employee submits dates/reason, manager approves or rejects with mandatory comment, HR does the final approval, emails on each rejection and on the final approval.',
            mockupIntro: 'Here\'s a two-level HR leave request flow. The employee submits leave type, dates and reason; the manager approves or rejects with a mandatory comment; HR does the final approval. Rejections loop back to the employee with an email, and the final approval triggers a confirmation email.'
        },
        {kind: 'prompt', label: 'Order & Invoice (linked processes)', prompt: 'Build two linked Petriflow processes: an Order with manager approval and a permanent open task showing all invoices via taskRef, and an Invoice that registers against an approved order and notifies the parent order via setData. Use findCase / assignTask / finishTask for cross-process communication.'},
        {kind: 'prompt', label: 'Email Processing Pipeline', prompt: 'Model an email processing pipeline: inbox → automatic classification (system task) → human triage → assignment to the right department → resolution → archive. Include retry on failed classification.'},
        {kind: 'prompt', label: 'Bug Tracker', prompt: 'Model a bug tracker: report → triage (priority + assignee) → in progress → review → done, with re-open loop from done back to in progress and a "won\'t fix" terminal branch.'},
        {kind: 'prompt', label: 'Purchase Order — Parallel Review', prompt: 'Model a purchase order with parallel review: when submitted, finance and procurement review in parallel (AND-split). When both finish (AND-join), manager makes final decision. Show explicit places and a system join task.'},
        {kind: 'prompt', label: 'Add manager approval to current canvas', prompt: 'Add a manager approval transition to the current canvas, between the existing submission and completion steps. Reuse existing roles where possible.'}
    ];

    constructor(
        public aiAssistantService: AiAssistantService,
        private viewHelperService: ViewHelperService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private http: HttpClient,
        private router: Router
    ) {
        this.scrollSubscription = this.viewHelperService.scrollSubject.subscribe(() => {
            this.scrollToBottomIfNear();
        });
        this.messageSubscription = this.aiAssistantService.messages$.subscribe(messages => {
            this.messages = messages;
            this.scrollToBottomIfNear();
        });
    }

    ngOnDestroy(): void {
        this.scrollSubscription?.unsubscribe();
        this.messageSubscription?.unsubscribe();
    }

    public trackByMsg = (_: number, msg: AiChatMessage) => msg.id ?? msg.date.getTime();

    // ─── Header badge ────────────────────────────────────────────────────────

    public get currentProviderLabel(): string {
        switch (this.aiAssistantService.getCurrentProvider()) {
            case 'claude': return 'Claude';
            case 'openai': return 'OpenAI';
            case 'gemini': return 'Gemini';
            default: return '';
        }
    }

    public get currentModel(): string {
        return this.aiAssistantService.getCurrentModel();
    }

    // ─── Sending ─────────────────────────────────────────────────────────────

    public onEnterPress(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey) return;
        event.preventDefault();
        this.sendCurrentMessage();
    }

    public onTextareaInput(event: Event): void {
        const ta = event.target as HTMLTextAreaElement;
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
    }

    public useQuickPrompt(prompt: string): void {
        this.currentMessage = prompt;
        setTimeout(() => this.messageInput?.nativeElement?.focus(), 0);
    }

    /**
     * Runs an example. For 'prompt' examples we just pre-fill the composer so
     * the user can tweak before sending. For 'mockup' examples we stream the
     * bundled XML straight into the chat — no provider call, works offline.
     * If the mockup XML is missing (404), we degrade gracefully to a real
     * AI prompt so the chip is still useful.
     */
    public async runQuickExample(ex: QuickExample): Promise<void> {
        if (ex.kind === 'prompt') {
            this.useQuickPrompt(ex.prompt || ex.label);
            return;
        }

        // Mockup path.
        if (this.loading || this.aiAssistantService.isStreaming()) return;

        this.loading = true;
        this.userIsAtBottom = true;
        try {
            const xml = await firstValueFrom(
                this.http.get(ex.mockupXmlUrl!, {responseType: 'text'})
            );
            await this.aiAssistantService.sendMockup({
                userPrompt: ex.mockupUserPrompt || ex.label,
                intro: ex.mockupIntro || 'Here is the mockup process:',
                xml
            });
        } catch (e) {
            // Mockup XML missing — fall back to sending the prompt to the real AI
            // so the chip still does *something*.
            this.snackBar.open(
                'Mockup file not bundled yet — sending to AI instead.',
                'OK',
                {duration: 3000}
            );
            if (this.aiAssistantService.isAiConfigured()) {
                await this.aiAssistantService.sendUserMessage(ex.mockupUserPrompt || ex.label);
            } else {
                this.useQuickPrompt(ex.mockupUserPrompt || ex.label);
            }
        } finally {
            this.loading = false;
        }
    }

    public sendCurrentMessage(): void {
        if (!this.aiAssistantService.isAiConfigured()) {
            this.snackBar.open('Configure an AI provider and API key first.', 'Open Settings', {duration: 5000})
                .onAction().subscribe(() => this.configureAgent());
            return;
        }
        if (this.stopMessageSending()) return;

        const text = this.currentMessage.trim();
        this.currentMessage = '';
        // Reset textarea height after sending.
        if (this.messageInput?.nativeElement) {
            this.messageInput.nativeElement.style.height = 'auto';
        }
        setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);

        this.loading = true;
        this.userIsAtBottom = true; // sending message means user wants to see reply
        this.aiAssistantService.sendUserMessage(text).finally(() => {
            this.loading = false;
        });
    }

    public stopMessageSending(): boolean {
        return this.loading || !this.currentMessage?.trim() || !this.aiAssistantService.isAiConfigured();
    }

    public resetAgent(): void {
        this.xmlExpanded = {};
        this.aiAssistantService.resetAgent();
    }

    public stopStreaming(): void {
        this.aiAssistantService.stopStreaming();
    }

    public configureAgent(): void {
        this.dialog.open(DialogConfigureAiComponent, {
            width: '50%',
            panelClass: 'dialog-width-50',
            data: {
                provider: this.aiAssistantService.getCurrentProvider(),
                model:    this.aiAssistantService.getCurrentModel(),
                keys:     this.aiAssistantService.getStoredKeys()
            }
        }).afterClosed().subscribe(value => {
            if (value && value.provider && value.model) {
                this.aiAssistantService.configureAiAssistant(value);
            }
        });
    }

    // ─── XML actions ─────────────────────────────────────────────────────────

    public applyXml(message: AiChatMessage): void {
        const result = this.aiAssistantService.applyXmlString(message.text);
        if (!result.ok) {
            this.snackBar.open(`Import failed: ${result.error}. XML is preserved — you can still download or copy it.`, 'OK', {duration: 6000});
            return;
        }
        if (result.structuralChange) {
            // BPMN project: the diagram owns the workflow structure, so only the
            // enrichment (forms/roles/actions/data) was applied.
            this.snackBar.open(
                'Forms, roles and actions applied. Structural changes are not reflected in the BPMN diagram.',
                'OK', {duration: 6000}
            );
        } else {
            this.snackBar.open('XML applied to canvas.', 'OK', {duration: 3000});
        }
        // In a BPMN project, return to the BPMN editor so the user keeps seeing
        // the diagram (importFromXml navigates to the Petriflow edit mode).
        if (this.aiAssistantService.isBpmnProject()) {
            this.router.navigate(['/modeler/bpmn']);
        }
    }

    public downloadXml(message: AiChatMessage): void {
        const blob = new Blob([message.text], {type: 'application/xml'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `petriflow-${new Date().toISOString().replace(/[:.]/g, '-')}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    public copyXml(message: AiChatMessage): void {
        navigator.clipboard.writeText(message.text).then(
            () => this.snackBar.open('XML copied to clipboard.', 'OK', {duration: 2500}),
            () => this.snackBar.open('Copy failed — your browser blocked clipboard access.', 'OK', {duration: 4000})
        );
    }

    public toggleXmlExpansion(message: AiChatMessage): void {
        if (message.id == null) return;
        this.xmlExpanded[message.id] = !this.xmlExpanded[message.id];
    }

    public isXmlExpanded(message: AiChatMessage): boolean {
        return message.id != null && !!this.xmlExpanded[message.id];
    }

    public xmlPreview(message: AiChatMessage): string {
        const lines = message.text.split('\n');
        return lines.slice(0, 6).join('\n') + (lines.length > 6 ? '\n...' : '');
    }

    // ─── Scroll handling ─────────────────────────────────────────────────────

    public onScroll(): void {
        const el = this.chatMessages?.nativeElement;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
        this.userIsAtBottom = distanceFromBottom < 80;
        this.showScrollFab = !this.userIsAtBottom;
    }

    public jumpToBottom(): void {
        this.userIsAtBottom = true;
        this.showScrollFab = false;
        this.scrollToBottom();
    }

    private scrollToBottomIfNear(): void {
        if (this.userIsAtBottom) {
            this.scrollToBottom();
        } else {
            this.showScrollFab = true;
        }
    }

    private scrollToBottom(): void {
        try {
            setTimeout(() => {
                if (this.chatMessages?.nativeElement) {
                    this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
                }
            }, 50);
        } catch {
            // best-effort
        }
    }
}
