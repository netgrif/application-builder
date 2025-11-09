// src/app/dialogs/dialog-assistant/brd/brd-assistant.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DraftState, BrdMsg } from '../models/chat.models';
import { OpenAiProxyService } from '../service/openai-proxy.service';

@Injectable({ providedIn: 'root' })
export class BrdAssistantService {
    private readonly draft$ = new BehaviorSubject<DraftState | null>(null);

    constructor(private readonly openai: OpenAiProxyService) {}

    /** Observable for template async pipes or facades */
    draftState(): Observable<DraftState | null> {
        return this.draft$.asObservable();
    }

    /** Allow dialog to restore persisted draft state on reopen */
    hydrateDraft(next: DraftState): void {
        const current = this.draft$.value ?? { version: 0, brd: null, tech: null };
        this.draft$.next({
            version: Math.max(current.version ?? 0, next.version ?? 0),
            brd: next.brd ?? current.brd ?? null,
            tech: next.tech ?? current.tech ?? null
        });
    }

    /** Create a BRD using the proxy's `generate({system,user})`. */
    async createBrd(seed: string): Promise<BrdMsg> {
        const t0 = performance.now();
        try {
            const { text, tokens } = await this.openai.generate({
                system: this.SYSTEM_CREATE_BRD,
                user: seed,
                maxOutputTokens: 2000
            });

            const clean = this.normalizePlain(text ?? '');

            const msg: BrdMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'brd',
                brd: clean,
                content: clean,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0)
            };

            const next: DraftState = {
                version: (this.draft$.value?.version ?? 0) + 1,
                brd: clean,
                tech: this.draft$.value?.tech
            };
            this.draft$.next(next);

            return msg;
        } catch (e: any) {
            throw this.wrapErr(e, 'create BRD');
        }
    }

    /** Refine BRD using the proxy's `generate({system,user})`. */
    async refineBrd(instruction: string, currentBrd: string): Promise<BrdMsg> {
        const t0 = performance.now();
        try {
            const user = [
                'Instruction:',
                instruction || 'Improve clarity and make acceptance criteria testable.',
                '',
                'Current BRD:',
                currentBrd || '(empty)'
            ].join('\n');

            const { text, tokens } = await this.openai.generate({
                system: this.SYSTEM_REFINE_BRD,
                user,
                maxOutputTokens: 2200
            });

            const clean = this.normalizePlain(text ?? '');

            const msg: BrdMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'brd',
                brd: clean,
                content: clean,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0)
            };

            const next: DraftState = {
                ...(this.draft$.value ?? { version: 0 }),
                version: (this.draft$.value?.version ?? 0) + 1,
                brd: clean
            };
            this.draft$.next(next);

            return msg;
        } catch (e: any) {
            throw this.wrapErr(e, 'refine BRD');
        }
    }

    makeEditSeed(brd: string): string {
        return [
            'Please improve this BRD:',
            '- Keep structure and IDs stable',
            '- Tighten scope and remove fluff',
            '- Make acceptance criteria explicit and testable',
            '',
            brd || ''
        ].join('\n');
    }

    // ====== Prompt templates ======
    private readonly SYSTEM_CREATE_BRD =
        `You are a senior product analyst.
Produce a clean, well-structured BRD in PLAIN TEXT format (no Markdown, no code fences).
Formatting rules:
- Each numbered section must start on a NEW LINE, like:
  1) OVERVIEW
  2) GOALS AND NON-GOALS
  3) ACTORS AND ROLES
  4) USER STORIES
  5) FUNCTIONAL REQUIREMENTS
  6) NON-FUNCTIONAL REQUIREMENTS
  7) ACCEPTANCE CRITERIA
- After each section title, insert line breaks before its content.
- Use short dash bullets (-) and keep each item on a separate line.
- Number acceptance criteria as AC1, AC2, …
- Keep it concise, implementation-agnostic, and easy to read in monospace plain text.
Return ONLY the BRD body text. Do NOT use Markdown symbols or wrapping.`;

    private readonly SYSTEM_REFINE_BRD =
        `You are a precise BRD editor.
Return PLAIN TEXT only (no Markdown).
Keep section numbering (1–7) and ensure each section starts on a NEW LINE.
Use dash bullets with one per line.
Make wording tighter, remove fluff, and ensure acceptance criteria are numbered (AC1, AC2, …) and testable.
Return only the refined BRD text.`;

    // ====== Utils ======
    private normalizePlain(s: string): string {
        return (s || '')
            .replace(/\r/g, '')
            .replace(/[ \t]+$/gm, '')  // strip trailing spaces
            .replace(/\n{3,}/g, '\n\n') // collapse extra blank lines
            .trim();
    }

    private mkId(): string {
        try { if ((crypto as any)?.randomUUID) return (crypto as any).randomUUID(); } catch {}
        return 'brd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    private wrapErr(e: any, action: string): Error {
        const s = this.extractErr(e);
        return new Error(`Failed to ${action}. ${s}`);
    }

    private extractErr(e: any): string {
        if (!e) return '';
        if (typeof e === 'string') return e;
        const status = e.status || e.code;
        const msg = e.message || e.statusText || '';
        const detail = e.error?.message || e.error?.detail || e.response?.data?.message || '';
        return [status && `[${status}]`, msg, detail].filter(Boolean).join(' ');
    }
}
