// src/app/dialogs/dialog-assistant/dialog-assistant.component.ts
import {
    Component,
    ElementRef,
    ViewChild,
    OnInit,
    OnDestroy,
    HostListener
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ChatMsg, TokenUsage, DraftState } from './models/chat.models';
import { trackByMsgFn as _track, mkId, now } from './utils/message-helpers';

import { BrdEditorFacade } from './brd/brd-editor.facade';
import { TechEditorFacade } from './tech/tech-editor.facade';
import { XmlGeneratorService } from './xml/xml-generator.service';
import { XmlApplierService } from './xml/xml-applier.service';
import { ScrollingService } from './utils/scrolling.service';

@Component({
    selector: 'nab-dialog-assistant',
    templateUrl: './dialog-assistant.component.html',
    styleUrls: ['./dialog-assistant.component.scss']
})
export class DialogAssistantComponent implements OnInit, OnDestroy {
    constructor(
        public readonly brd: BrdEditorFacade,
        public readonly tech: TechEditorFacade,
        private readonly xmlGen: XmlGeneratorService,
        private readonly xmlApply: XmlApplierService,
        private readonly scrolling: ScrollingService
    ) {}

    // ===== Persistence key =====
    private readonly STORAGE_KEY = 'nab:dialog-assistant:v1';

    // UI state
    messages: ChatMsg[] = [];
    prompt = '';
    isLoading = false;
    tokenUsage?: TokenUsage;
    rateInfo?: string;
    showTechCollapsedById: Record<string, boolean> = {};

    @ViewChild('scrollArea') private scrollArea?: ElementRef<HTMLElement>;
    @ViewChild('promptArea') private promptArea?: ElementRef<HTMLTextAreaElement>;

    trackByMsgFn = _track;

    // ===== Lifecycle =====
    ngOnInit(): void {
        this.restoreState();
        // Clear only when whole child app unloads (tab reload/close or redeploy)
        window.addEventListener('beforeunload', this.clearOnAppClose);
    }

    ngOnDestroy(): void {
        window.removeEventListener('beforeunload', this.clearOnAppClose);
        // Do NOT clear state here; dialog close should keep context
    }

    // ===== Option A: reset via window.postMessage(...) from Deploy/Refresh button =====
    @HostListener('window:message', ['$event'])
    onParentMessage(ev: MessageEvent) {
        if (!ev?.data) return;
        if (ev.data.type === 'child-app:reset') {
            this.clearAllStateAndUI();
        }
    }

    // ===== Composer / generic send (adds a user message) =====
    async send() {
        const text = (this.prompt || '').trim();
        if (!text) return;

        const stick = this.scrolling.isNearBottom(this.scrollArea);
        this.pushUser(text);
        this.prompt = '';

        // Try command mode first (/brd, /tech, /xml, /refine brd|tech, /clear)
        const handled = await this.tryHandleCommand(text);
        if (!handled) {
            await this.routeAuto(text);
        }

        await this.persistState();
        if (stick) this.deferScrollToBottom();
    }

    // ===== Domain actions wired from template =====
    async refine(kind: 'brd' | 'tech' | 'both') {
        if (this.isLoading) return;
        this.isLoading = true;
        const stick = this.scrolling.isNearBottom(this.scrollArea);

        try {
            if (kind === 'brd' || kind === 'both') {
                const brdState = await firstValueFrom<DraftState | null>(this.brd.draft$);
                const current = brdState?.brd ?? '';
                const msg = await this.brd.refine(this.prompt || '', current);
                this.messages.push(msg);
                this.bumpTokenUsage(msg.tokens);
            }

            if (kind === 'tech' || kind === 'both') {
                const techState = await firstValueFrom<DraftState | null>(this.tech.draft$);
                const current = techState?.tech ?? '';
                const msg = await this.tech.refine(this.prompt || '', current);
                this.messages.push(msg);
                this.bumpTokenUsage(msg.tokens);
            }
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: (err && (err.message || String(err))) || 'Unknown error',
                content: 'An error occurred while refining.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
            if (stick) this.deferScrollToBottom();
        }
    }

    async generateXmlFromDraft() {
        if (this.isLoading) return;
        this.isLoading = true;
        const stick = this.scrolling.isNearBottom(this.scrollArea);

        try {
            const techState = await firstValueFrom<DraftState | null>(this.tech.draft$);
            const currentTech = techState?.tech;
            if (!currentTech) return;

            const msg = await this.xmlGen.generate(currentTech);
            msg.content = msg.xml ?? msg.content; // normalize for rendering
            this.messages.push(msg);
            this.bumpTokenUsage(msg.tokens);
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: (err && (err.message || String(err))) || 'Unknown error',
                content: 'Failed to generate XML.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
            if (stick) this.deferScrollToBottom();
        }
    }

    async applyXml(xml: string) {
        const stick = this.scrolling.isNearBottom(this.scrollArea);
        try {
            await this.xmlApply.apply(xml);
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                content: 'XML applied successfully.'
            });
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: (err && (err.message || String(err))) || 'Unknown error',
                content: 'Failed to apply XML.'
            });
        } finally {
            await this.persistState();
            if (stick) this.deferScrollToBottom();
        }
    }

    // ===== Helpers used by the template =====
    makeBrdEditSeed(v: string) { return this.brd.seed(v); }
    makeTechEditSeed(v: string) { return this.tech.seed(v); }

    toggleTechCollapsed(id: string) {
        this.showTechCollapsedById[id] = !this.showTechCollapsedById[id];
    }

    copyMsg(msg: ChatMsg) {
        const text = msg?.content ?? '';
        if (!text) return;
        navigator.clipboard?.writeText(text);
    }

    onClear() {
        this.messages = [];
        this.tokenUsage = undefined;
        this.rateInfo = undefined;
        this.scrolling.scrollToTop(this.scrollArea);
        this.persistState(); // reflect clear
    }

    onAttachContext() {
        // keep your existing behavior here (file/context picker, etc.)
    }

    // ===== Private utilities =====
    private pushUser(text: string) {
        this.messages.push({
            id: mkId(),
            role: 'user',
            kind: 'info',
            content: text,
            timestamp: now()
        });
    }

    private bumpTokenUsage(tokens?: number) {
        if (!tokens) return;
        if (!this.tokenUsage) this.tokenUsage = { total: 0 };
        this.tokenUsage.total += tokens;
    }

    /** Defer until after view updates, then smooth-scroll using ScrollingService */
    private deferScrollToBottom() {
        setTimeout(() => this.scrolling.scrollToBottom(this.scrollArea, true), 0);
    }

    // ===== Commands & Routing =====

    /** Handle slash-commands. Returns true if a command was executed. */
    private async tryHandleCommand(input: string): Promise<boolean> {
        const m = input.match(/^\/(\w+)(?:\s+([\s\S]*))?$/i);
        if (!m) return false;

        const cmd = m[1].toLowerCase();
        const arg = (m[2] || '').trim();

        switch (cmd) {
            case 'clear':
                this.onClear();
                return true;

            case 'brd':
                await this.doBrdCreate(arg || 'Create a concise, testable BRD for my idea.');
                return true;

            case 'refine':
                if (/^brd\b/i.test(arg)) {
                    await this.doRefineBrd(
                        arg.replace(/^brd\b/i, '').trim() || 'Improve clarity and acceptance criteria.'
                    );
                    return true;
                }
                if (/^tech\b/i.test(arg)) {
                    await this.doRefineTech(
                        arg.replace(/^tech\b/i, '').trim() || 'Tighten roles, fields, validations and guards.'
                    );
                    return true;
                }
                // fallback: refine TECH if exists else BRD
                await this.routeRefine(arg || 'Improve the draft.');
                return true;

            case 'tech':
                // create TECH from current BRD
                await this.doTechCreate();
                return true;

            case 'xml':
                await this.doXmlGenerate();
                return true;

            default:
                return false;
        }
    }

    /** Auto-routing when not a slash command */
    private async routeAuto(instruction: string): Promise<void> {
        // snapshot drafts (typed)
        const brdState = await firstValueFrom(this.brd.draft$);
        const techState = await firstValueFrom(this.tech.draft$);
        const hasBrd = !!brdState?.brd;
        const hasTech = !!techState?.tech;

        // intents
        const wantsXml = /(xml|petriflow\s+xml|generate\s+xml)/i.test(instruction);
        const asksRefineBrd =
            /\b(refine|improve|edit)\b.*\bbrd\b/i.test(instruction) ||
            /\bbrd\b.*\b(refine|improve|edit)\b/i.test(instruction);
        const asksRefineTech =
            /\b(refine|improve|edit)\b.*\btech\b/i.test(instruction) ||
            /\btech\b.*\b(refine|improve|edit)\b/i.test(instruction);

        this.isLoading = true;
        const stick = this.scrolling.isNearBottom(this.scrollArea);

        try {
            if (!hasBrd) {
                // First interaction: create BRD from the instruction
                await this.doBrdCreate(instruction);
                return;
            }

            // We have a BRD already
            if (!hasTech) {
                // Respect explicit intent if user wants to refine BRD
                if (asksRefineBrd) {
                    await this.doRefineBrd(instruction);
                    return;
                }

                // If they ask for TECH or XML before accepting → nudge to accept BRD
                if (wantsXml || asksRefineTech) {
                    this.messages.push({
                        id: mkId(),
                        role: 'assistant',
                        kind: 'info',
                        timestamp: now(),
                        content: 'TECH spec nie je ešte vytvorený. Najprv klikni „Accept BRD → Create TECH“.'
                    });
                    return;
                }

                // Default when BRD exists but TECH not accepted yet: wait for user action
                this.messages.push({
                    id: mkId(),
                    role: 'assistant',
                    kind: 'info',
                    timestamp: now(),
                    content: 'BRD je pripravený. Môžeš ho upraviť (Edit BRD) alebo potvrdiť (Accept BRD → Create TECH).'
                });
                return;
            }

            // We have TECH already
            if (wantsXml) {
                await this.doXmlGenerate();
                return;
            }

            if (asksRefineBrd) {
                await this.doRefineBrd(instruction);
                return;
            }

            if (asksRefineTech) {
                await this.doRefineTech(instruction);
                return;
            }

            // Default once TECH exists: refine TECH
            await this.doRefineTech(instruction);
        } finally {
            this.isLoading = false;
            await this.persistState();
            if (stick) this.deferScrollToBottom();
        }
    }

    private async routeRefine(instruction: string) {
        const techState = await firstValueFrom<DraftState | null>(this.tech.draft$);
        const brdState = await firstValueFrom<DraftState | null>(this.brd.draft$);
        if (techState?.tech) {
            await this.doRefineTech(instruction);
        } else {
            await this.doRefineBrd(instruction);
        }
        await this.persistState();
    }

    /** Create BRD from seed/instruction text */
    private async doBrdCreate(seed: string) {
        this.isLoading = true;
        try {
            const msg = await this.brd.create(seed);
            this.messages.push(msg);
            this.bumpTokenUsage(msg.tokens);
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: err?.message || String(err),
                content: 'Failed to create BRD.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
        }
    }

    /** Create TECH from current BRD (used by Accept BRD and auto-routing when needed) */
    private async doTechCreate(): Promise<void> {
        const brdState = await firstValueFrom(this.brd.draft$);
        const brdText = brdState?.brd || '';
        if (!brdText) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                content: 'No BRD found. Create a BRD first.'
            });
            await this.persistState();
            return;
        }

        this.isLoading = true;
        const stick = this.scrolling.isNearBottom(this.scrollArea);

        try {
            const msg = await this.tech.createFromBrd(brdText); // via facade
            this.messages.push(msg);
            this.bumpTokenUsage(msg.tokens);
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: err?.message || String(err),
                content: 'Failed to create TECH from BRD.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
            if (stick) this.deferScrollToBottom();
        }
    }

    /** Generate XML from current TECH */
    private async doXmlGenerate() {
        const techState = await firstValueFrom<DraftState | null>(this.tech.draft$);
        const techText = techState?.tech || '';
        if (!techText) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                content: 'No TECH spec yet. Create TECH from BRD first (e.g., type /tech).'
            });
            await this.persistState();
            return;
        }

        this.isLoading = true;
        try {
            const msg = await this.xmlGen.generate(techText);
            msg.content = msg.xml ?? msg.content; // normalize for rendering
            this.messages.push(msg);
            this.bumpTokenUsage(msg.tokens);
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: err?.message || String(err),
                content: 'Failed to generate XML.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
        }
    }

    /** Refine BRD with the instruction plus current BRD */
    private async doRefineBrd(instruction: string) {
        const brdState = await firstValueFrom<DraftState | null>(this.brd.draft$);
        const current = brdState?.brd || '';
        if (!current) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                content: 'There is no BRD to refine yet. Create one first (e.g., type /brd).'
            });
            await this.persistState();
            return;
        }

        this.isLoading = true;
        try {
            const msg = await this.brd.refine(
                instruction || 'Improve the BRD for clarity and ACs.',
                current
            );
            this.messages.push(msg);
            this.bumpTokenUsage(msg.tokens);
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: err?.message || String(err),
                content: 'An error occurred while refining BRD.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
        }
    }

    /** Refine TECH with the instruction plus current TECH */
    private async doRefineTech(instruction: string) {
        const techState = await firstValueFrom<DraftState | null>(this.tech.draft$);
        const current = techState?.tech || '';
        if (!current) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                content: 'There is no TECH to refine yet. Create it from BRD first (e.g., type /tech).'
            });
            await this.persistState();
            return;
        }

        this.isLoading = true;
        try {
            const msg = await this.tech.refine(
                instruction || 'Tighten roles, fields, validations and guards.',
                current
            );
            this.messages.push(msg);
            this.bumpTokenUsage(msg.tokens);
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: err?.message || String(err),
                content: 'An error occurred while refining TECH.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
        }
    }

    /** Accept current BRD and immediately create TECH from it */
    async acceptBrd() {
        const brdState = await firstValueFrom(this.brd.draft$);
        const brdText = brdState?.brd || '';
        if (!brdText) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                content: 'No BRD to accept. Create a BRD first.'
            });
            await this.persistState();
            return;
        }

        this.isLoading = true;
        const stick = this.scrolling.isNearBottom(this.scrollArea);
        try {
            const msg = await this.tech.createFromBrd(brdText);
            this.messages.push(msg);
            this.bumpTokenUsage(msg.tokens);
        } catch (err: any) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                error: err?.message || String(err),
                content: 'Failed to create TECH from BRD.'
            });
        } finally {
            this.isLoading = false;
            await this.persistState();
            if (stick) this.deferScrollToBottom();
        }
    }

    // ===== Formatting helpers (display only) =====
    formatBrd(src: string): string {
        if (!src) return '';
        let s = src;
        s = s.replace(/\s*(?=(\d\)\s+[A-Z][^\n]+))/g, '\n');
        s = s.replace(/\s-\s/g, '\n- ');
        s = s.replace(/\. +(?=[A-Z])/g, '.\n');
        s = s.replace(/\n{3,}/g, '\n\n');
        return s.trim();
    }

    formatTech(src: string): string {
        if (!src) return '';
        let s = src
            .replace(/\r/g, '')
            .replace(/\s-\s/g, '\n- ')
            .replace(/; +/g, ';\n')
            .replace(/\. +(?=[A-Z(])/g, '.\n')
            .replace(/\n{3,}/g, '\n\n');

        const heads = ['HEADER', 'ROLES', 'DATA FIELDS', 'TASKS', 'ACTIONS', 'ROUTING RULES'];
        heads.forEach(h => {
            const re = new RegExp(`\\s*${h}\\b`, 'g');
            s = s.replace(re, `\n\n${h}`);
        });

        return s.trim();
    }

    // ===== Persistence helpers =====
    /** Save messages + a merged draft snapshot */
    private async persistState(): Promise<void> {
        try {
            const brdState = await firstValueFrom(this.brd.draft$);
            const techState = await firstValueFrom(this.tech.draft$);

            const draft: DraftState | null = {
                version: Math.max(brdState?.version ?? 0, techState?.version ?? 0),
                brd: brdState?.brd ?? null,
                tech: techState?.tech ?? null
            } as DraftState;

            const state = { messages: this.messages, draft };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch {
            // ignore storage errors
        }
    }

    /** Restore messages + ask services to hydrate draft (if supported) */
    private restoreState(): void {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { messages?: ChatMsg[]; draft?: DraftState | null };

            if (Array.isArray(parsed?.messages)) {
                this.messages = parsed!.messages!;
            }

            if (parsed?.draft) {
                const d = parsed.draft!;
                // If facades expose hydrate(), call them; otherwise no-op
                (this.brd as any).hydrate?.(d);
                (this.tech as any).hydrate?.(d);
            }
        } catch {
            // ignore parse errors
        }
    }

    /** Clear only when the whole child app is closed/reloaded */
    private clearOnAppClose = () => {
        try { localStorage.removeItem(this.STORAGE_KEY); } catch {}
    };

    /** Centralized reset for Option A and any future triggers */
    private async clearAllStateAndUI() {
        try { localStorage.removeItem(this.STORAGE_KEY); } catch {}

        this.messages = [];
        this.tokenUsage = undefined;
        this.rateInfo = undefined;
        this.showTechCollapsedById = {};

        // Reset reactive drafts if facades support it
        (this.brd as any).hydrate?.({ version: 0, brd: null, tech: null });
        (this.tech as any).hydrate?.({ version: 0, brd: null, tech: null });

        // Reflect cleared state in storage immediately
        await this.persistState();
    }
}
