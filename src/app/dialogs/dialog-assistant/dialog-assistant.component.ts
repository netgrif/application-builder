import { Component, ElementRef, ViewChild } from '@angular/core';
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
    templateUrl: './dialog-assistant.component.html'
})
export class DialogAssistantComponent {
    // Expose facades for async pipes in the template
    constructor(
        public readonly brd: BrdEditorFacade,
        public readonly tech: TechEditorFacade,
        private readonly xmlGen: XmlGeneratorService,
        private readonly xmlApply: XmlApplierService,
        private readonly scrolling: ScrollingService
    ) {}

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

    // --- Add below inside the component class ---

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
                    await this.doRefineBrd(arg.replace(/^brd\b/i, '').trim() || 'Improve clarity and acceptance criteria.');
                    return true;
                }
                if (/^tech\b/i.test(arg)) {
                    await this.doRefineTech(arg.replace(/^tech\b/i, '').trim() || 'Tighten roles, fields, validations and guards.');
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
        // snapshot drafts
        const brdState = await firstValueFrom<DraftState | null>(this.brd.draft$);
        const techState = await firstValueFrom<DraftState | null>(this.tech.draft$);
        const hasBrd = !!brdState?.brd;
        const hasTech = !!techState?.tech;

        // If user mentions XML explicitly, prefer XML path when TECH exists
        const wantsXml = /\bxml|petriflow\s+xml|generate\s+xml/i.test(instruction);

        this.isLoading = true;
        const stick = this.scrolling.isNearBottom(this.scrollArea);

        try {
            if (!hasBrd) {
                await this.doBrdCreate(instruction);
            } else if (!hasTech) {
                // If they asked to “refine brd”, do that; otherwise create TECH from BRD
                if (/\brefine\b.*\bbrd\b/i.test(instruction)) {
                    await this.doRefineBrd(instruction);
                } else {
                    await this.doTechCreate(instruction); // pass instruction as hint
                }
            } else {
                // We have TECH already
                if (wantsXml) {
                    await this.doXmlGenerate();
                } else if (/\brefine\b.*\bbrd\b/i.test(instruction)) {
                    await this.doRefineBrd(instruction);
                } else {
                    await this.doRefineTech(instruction);
                }
            }
        } finally {
            this.isLoading = false;
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
    }

    /** Create BRD from seed/instruction text */
    private async doBrdCreate(seed: string) {
        this.isLoading = true;
        const t0 = performance.now();
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
        }
    }

    /** Create TECH from current BRD (optionally using the instruction as a hint) */
    private async doTechCreate(hint?: string) {
        const brdState = await firstValueFrom<DraftState | null>(this.brd.draft$);
        const brdText = brdState?.brd || '';
        if (!brdText) {
            this.messages.push({
                id: mkId(),
                role: 'assistant',
                kind: 'info',
                timestamp: now(),
                content: 'No BRD found. Create a BRD first (e.g., type /brd or just describe your app).'
            });
            return;
        }

        this.isLoading = true;
        try {
            // If your backend supports it, you could pass {brd, hint}; we just call createFromBrd(brd)
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
            return;
        }

        this.isLoading = true;
        try {
            const msg = await this.brd.refine(instruction || 'Improve the BRD for clarity and ACs.', current);
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
            return;
        }

        this.isLoading = true;
        try {
            const msg = await this.tech.refine(instruction || 'Tighten roles, fields, validations and guards.', current);
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
        }
    }
}
