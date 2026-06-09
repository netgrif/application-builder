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
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
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
    /** Message count at the last stream emit — used to scroll only on new bubbles. */
    private _lastMsgCount = 0;

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

    /**
     * Example prompts shown when an imported BPMN process is open. Instead of
     * "generate from scratch", these steer the user toward enriching the existing
     * diagram with Petriflow concepts (data, roles, forms, actions) — the workflow
     * structure stays owned by the BPMN diagram.
     */
    public bpmnEnrichExamples: QuickExample[] = [
        {kind: 'prompt', label: '📝 Add forms to tasks', prompt: 'Add a sensible form with the relevant input fields to each user task in this process. Keep the workflow structure and all ids unchanged.'},
        {kind: 'prompt', label: '👥 Add roles & permissions', prompt: 'Add the roles this process needs and assign view / perform permissions to the appropriate tasks. Keep the workflow structure and all ids unchanged.'},
        {kind: 'prompt', label: '🔧 Add an action', prompt: 'Add an action that sets a field value when a task is finished (for example a status or a timestamp). Keep the workflow structure and all ids unchanged.'},
        {kind: 'prompt', label: '🗃️ Add data fields', prompt: 'Add the data fields each task needs to capture, with appropriate types. Keep the workflow structure and all ids unchanged.'},
        {kind: 'prompt', label: '🏷️ Improve task labels', prompt: 'Rename the tasks to clear, human-readable labels. Keep the workflow structure and all ids unchanged.'}
    ];

    constructor(
        public aiAssistantService: AiAssistantService,
        private viewHelperService: ViewHelperService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private http: HttpClient,
        private router: Router,
        private sanitizer: DomSanitizer
    ) {
        this.scrollSubscription = this.viewHelperService.scrollSubject.subscribe(() => {
            this.scrollToBottomIfNear();
        });
        this.messageSubscription = this.aiAssistantService.messages$.subscribe(messages => {
            // Only snap to the latest when a NEW bubble appears — not on every
            // streaming token — so the view doesn't keep yanking down while a long
            // XML reply generates. The jump-to-bottom FAB stays available.
            const grew = messages.length > this._lastMsgCount;
            this._lastMsgCount = messages.length;
            this.messages = messages;
            if (grew) this.scrollToBottomIfNear();
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

    // ─── Patch actions ───────────────────────────────────────────────────────

    /** Human-readable summary of a patch's operations, for the action card. */
    public patchSummary(message: AiChatMessage): string[] {
        try {
            const parsed = JSON.parse(message.text);
            const ops = Array.isArray(parsed) ? parsed : parsed?.ops;
            if (!Array.isArray(ops)) return [];
            return ops.map((o: any) => {
                switch (o.op) {
                    case 'setLabel':   return `Rename ${o.task} → “${o.value}”`;
                    case 'addRole':    return `Add role “${o.title ?? o.id}”`;
                    case 'assignRole': return `Give ${o.role} ${(o.permissions || ['perform', 'view']).join(' / ')} on ${o.task}`;
                    case 'addField':   return `Add ${o.type ?? 'text'} field “${o.title ?? o.id}”${o.task ? ' to ' + o.task : ''}`;
                    case 'addAction':  return `Add ${o.trigger ?? 'finish'} action on ${o.task}`;
                    default:           return String(o.op ?? 'change');
                }
            });
        } catch {
            return [];
        }
    }

    public applyPatch(message: AiChatMessage): void {
        const result = this.aiAssistantService.applyPatchString(message.text);
        if (!result.ok) {
            this.snackBar.open(`Could not apply changes: ${result.error}`, 'OK', {duration: 6000});
            return;
        }
        const skipped = result.failed ? ` (${result.failed} skipped)` : '';
        this.snackBar.open(`Applied ${result.applied} change${result.applied === 1 ? '' : 's'}${skipped}.`, 'OK', {duration: 4000});
        this.router.navigate([this.aiAssistantService.isBpmnProject() ? '/modeler/bpmn' : '/modeler']);
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

    // ─── Bubble rendering: split prose from XML ──────────────────────────────
    //
    // The assistant reply often ends with a big ```xml … ``` block. Rendering it
    // through markdown looks bad while streaming (an unclosed fence shows as raw
    // wrapped text) and never reads like code. So we split the bubble: the prose
    // goes through markdown, and the XML is shown in a dedicated monospace block
    // (whitespace preserved) that already looks like XML even mid-stream.

    /** Prose part of an assistant bubble — everything before the XML block. */
    public proseOf(text: string): string {
        if (!text) return '';
        const cut = this.xmlStart(text);
        return cut < 0 ? text : text.slice(0, cut).trim();
    }

    /** XML part of an assistant bubble, tolerant of an unclosed fence while streaming. */
    public xmlOf(text: string): string | null {
        if (!text) return null;
        const fence = text.match(/```(?:xml)?[ \t]*\r?\n?/i);
        if (fence && fence.index !== undefined) {
            const after = text.slice(fence.index + fence[0].length);
            const close = after.indexOf('```');
            const body = close >= 0 ? after.slice(0, close) : after;
            if (/<\w/.test(body)) return body.trim();
        }
        const doc = text.indexOf('<document');
        if (doc >= 0) {
            const end = text.lastIndexOf('</document>');
            return (end > doc ? text.slice(doc, end + '</document>'.length) : text.slice(doc)).trim();
        }
        return null;
    }

    // ─── XML syntax highlighting ─────────────────────────────────────────────
    //
    // Lightweight, dependency-free XML highlighter (tags / attributes / values /
    // comments). Works mid-stream on partial XML. Result is sanitized HTML bound
    // via [innerHTML]. A 1-entry cache avoids re-tokenizing the same (growing)
    // string repeatedly across change-detection cycles.

    private _hlInput: string | null = null;
    private _hlOutput: SafeHtml = '';

    private static readonly XML_TOKEN_RE =
        /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/?[A-Za-z_][\w:.\-]*(?:\s+[\w:.\-]+\s*=\s*"[^"]*")*\s*\/?>/g;

    public highlightXml(xml: string): SafeHtml {
        if (!xml) return '';
        if (xml === this._hlInput) return this._hlOutput;

        let out = '';
        let last = 0;
        const re = new RegExp(AiChatComponentComponent.XML_TOKEN_RE);
        let m: RegExpExecArray | null;
        while ((m = re.exec(xml)) !== null) {
            out += this.esc(xml.slice(last, m.index));   // text content (default colour)
            out += this.hlTag(m[0]);
            last = m.index + m[0].length;
        }
        out += this.esc(xml.slice(last));

        this._hlInput = xml;
        this._hlOutput = this.sanitizer.bypassSecurityTrustHtml(out);
        return this._hlOutput;
    }

    private esc(s: string): string {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private hlTag(tag: string): string {
        if (tag.startsWith('<!--')) return `<span class="xtok-comment">${this.esc(tag)}</span>`;
        if (tag.startsWith('<?'))   return `<span class="xtok-decl">${this.esc(tag)}</span>`;

        const m = tag.match(/^(<\/?)([\w:.\-]+)([\s\S]*?)(\/?>)$/);
        if (!m) return this.esc(tag);
        const [, open, name, attrs, close] = m;

        const attrHtml = attrs.replace(
            /([\w:.\-]+)(\s*=\s*)("[^"]*")/g,
            (_full, an: string, eq: string, av: string) =>
                `<span class="xtok-attr">${this.esc(an)}</span>${this.esc(eq)}` +
                `<span class="xtok-val">${this.esc(av)}</span>`
        );

        return `<span class="xtok-punct">${this.esc(open)}</span>` +
               `<span class="xtok-tag">${this.esc(name)}</span>` +
               attrHtml +
               `<span class="xtok-punct">${this.esc(close)}</span>`;
    }

    /** Index where the XML region starts (fence or raw <document>), or -1. */
    private xmlStart(text: string): number {
        const fence = text.match(/```(?:xml)?/i);
        if (fence && fence.index !== undefined) return fence.index;
        const doc = text.indexOf('<document');
        return doc >= 0 ? doc : -1;
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
