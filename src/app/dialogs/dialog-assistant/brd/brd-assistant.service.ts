// src/app/dialogs/dialog-assistant/brd/brd-assistant.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DraftState, BrdMsg } from '../models/chat.models';
import {OpenAiProxyService} from "../service/openai-proxy.service";

@Injectable({ providedIn: 'root' })
export class BrdAssistantService {
    private readonly draft$ = new BehaviorSubject<DraftState | null>(null);

    constructor(private readonly openai: OpenAiProxyService) {}

    draftState(): Observable<DraftState | null> {
        return this.draft$.asObservable();
    }

    /** Create a BRD using the proxy's `generate({system,user})`. */
    async createBrd(seed: string): Promise<BrdMsg> {
        const t0 = performance.now();
        try {
            const { text, tokens, rateInfo } = await this.openai.generate({
                system: this.SYSTEM_CREATE_BRD,
                user: seed,
                maxOutputTokens: 2000
            });

            const msg: BrdMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'brd',
                brd: text,
                content: text,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0),
            };

            const next: DraftState = {
                version: (this.draft$.value?.version ?? 0) + 1,
                brd: text,
                tech: this.draft$.value?.tech,
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
                currentBrd || '(empty)',
            ].join('\n');

            const { text, tokens } = await this.openai.generate({
                system: this.SYSTEM_REFINE_BRD,
                user,
                maxOutputTokens: 2200
            });

            const msg: BrdMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'brd',
                brd: text,
                content: text,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0),
            };

            const next: DraftState = {
                ...(this.draft$.value ?? { version: 0 }),
                version: (this.draft$.value?.version ?? 0) + 1,
                brd: text,
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
            brd || '',
        ].join('\n');
    }

    // ====== Prompt templates ======
    private readonly SYSTEM_CREATE_BRD =
        `You are a senior product analyst.
Produce a concise, well-structured BRD with these sections:
- Overview
- Goals / Non-goals
- Actors & Roles
- User Stories
- Functional Requirements
- Non-functional Requirements
- Acceptance Criteria (numbered, testable)
Keep it compact and implementation-agnostic.`;

    private readonly SYSTEM_REFINE_BRD =
        `You are a precise BRD editor.
Refine the BRD per the Instruction. Keep the same sections and identifiers.
Make acceptance criteria explicit and testable. Remove fluff.`;

    // ====== Utils ======
    private mkId(): string {
        try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch {}
        return 'brd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
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
