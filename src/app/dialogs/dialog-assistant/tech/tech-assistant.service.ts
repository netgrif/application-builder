// src/app/dialogs/dialog-assistant/tech/tech-assistant.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DraftState, TechMsg } from '../models/chat.models';
import {OpenAiProxyService} from "../service/openai-proxy.service";

@Injectable({ providedIn: 'root' })
export class TechAssistantService {
    private readonly draft$ = new BehaviorSubject<DraftState | null>(null);

    constructor(private readonly openai: OpenAiProxyService) {}

    draftState(): Observable<DraftState | null> {
        return this.draft$.asObservable();
    }

    /** Create TECH spec from BRD using `generate({system,user})`. */
    async createFromBrd(brd: string): Promise<TechMsg> {
        const t0 = performance.now();
        try {
            const user = [
                'BRD:',
                brd || '(empty)'
            ].join('\n');

            const { text, tokens } = await this.openai.generate({
                system: this.SYSTEM_CREATE_TECH,
                user,
                maxOutputTokens: 2600
            });

            const msg: TechMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'tech',
                tech: text,
                content: text,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0),
            };

            const next: DraftState = {
                version: (this.draft$.value?.version ?? 0) + 1,
                brd: this.draft$.value?.brd ?? brd,
                tech: text,
            };
            this.draft$.next(next);

            return msg;
        } catch (e: any) {
            throw this.wrapErr(e, 'create TECH from BRD');
        }
    }

    /** Refine TECH spec using `generate({system,user})`. */
    async refineTech(instruction: string, currentTech: string): Promise<TechMsg> {
        const t0 = performance.now();
        try {
            const user = [
                'Instruction:',
                instruction || 'Tighten roles, fields, constraints, validations, and transition guards.',
                '',
                'Current TECH:',
                currentTech || '(empty)',
            ].join('\n');

            const { text, tokens } = await this.openai.generate({
                system: this.SYSTEM_REFINE_TECH,
                user,
                maxOutputTokens: 2600
            });

            const msg: TechMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'tech',
                tech: text,
                content: text,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0),
            };

            const next: DraftState = {
                ...(this.draft$.value ?? { version: 0 }),
                version: (this.draft$.value?.version ?? 0) + 1,
                tech: text,
            };
            this.draft$.next(next);

            return msg;
        } catch (e: any) {
            throw this.wrapErr(e, 'refine TECH');
        }
    }

    makeEditSeed(tech: string): string {
        return [
            'Improve this Petriflow technical specification:',
            '- Keep IDs stable (process, tasks, transitions, forms)',
            '- Tighten role/permission mapping',
            '- Ensure form fields and validations are explicit',
            '- Add clear transition guards and actions',
            '',
            tech || '',
        ].join('\n');
    }

    // ===== Prompts =====
    private readonly SYSTEM_CREATE_TECH =
        `You are a Petriflow solution architect.
From the BRD, produce a concise TECH specification suitable for implementation on Petriflow/Netgrif:
- Process ID and title
- Roles and permissions
- Data model (fields with types, constraints, defaults, visibility)
- Forms (per task) with layout hints
- Tasks & Transitions (guards, actions, events)
- Business rules and SLA
Keep it implementable and consistent.`;

    private readonly SYSTEM_REFINE_TECH =
        `You are a strict Petriflow TECH editor.
Refine the TECH per the Instruction. Keep IDs stable, make fields/validations concrete, and clarify guards/actions.`;

    // ===== Utils =====
    private mkId(): string {
        try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch {}
        return 'tech-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
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
