import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DraftState, TechMsg } from '../models/chat.models';
import { OpenAiProxyService } from '../service/openai-proxy.service';

@Injectable({ providedIn: 'root' })
export class TechAssistantService {
    private readonly draft$ = new BehaviorSubject<DraftState | null>(null);

    constructor(private readonly openai: OpenAiProxyService) {}

    draftState(): Observable<DraftState | null> {
        return this.draft$.asObservable();
    }

    /** Allow dialog to restore persisted draft state on reopen */
    hydrateDraft(next: DraftState): void {
        const current = this.draft$.value ?? { version: 0, brd: null, tech: null };
        this.draft$.next({
            version: Math.max(current.version ?? 0, next.version ?? 0),
            brd: next?.brd ?? current.brd ?? null,
            tech: next?.tech ?? current.tech ?? null
        });
    }

    /** Create TECH spec from BRD using `generate({system,user})`. */
    async createFromBrd(brd: string): Promise<TechMsg> {
        const t0 = performance.now();

        const system = `
You are a software architect that generates deterministic technical specifications
for a Petriflow process model based on a given BRD.
Follow the exact TECH SPEC FORMAT below and output plain text (no markdown).
`.trim();

        const user = `
Convert the following Business Requirements Document (BRD) into a TECH SPEC
following the exact format below. Output only plain text in this structure.

${this.techSpecTemplate()}
---
BRD INPUT:
${brd}
`.trim();

        try {
            const { text, tokens } = await this.openai.generate({
                system,
                user,
                model: 'gpt-4o-mini',
                maxOutputTokens: 4000
            });

            const clean = this.normalizePlain(text ?? '');

            const msg: TechMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'tech',
                tech: clean,
                content: clean,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0)
            };

            // bump draft state
            const next: DraftState = {
                version: (this.draft$.value?.version ?? 0) + 1,
                brd: this.draft$.value?.brd ?? brd,
                tech: clean
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
                currentTech || '(empty)'
            ].join('\n');

            const { text, tokens } = await this.openai.generate({
                system: this.SYSTEM_REFINE_TECH,
                user,
                maxOutputTokens: 2600
            });

            const clean = this.normalizePlain(text ?? '');

            const msg: TechMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'tech',
                tech: clean,
                content: clean,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0)
            };

            const next: DraftState = {
                ...(this.draft$.value ?? { version: 0 }),
                version: (this.draft$.value?.version ?? 0) + 1,
                tech: clean
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
            tech || ''
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
    /** Normalize plain text: collapse excessive blank lines, trim trailing spaces */
    private normalizePlain(s: string): string {
        return (s || '')
            .replace(/\r/g, '')
            .replace(/[ \t]+$/gm, '')   // strip trailing spaces per line
            .replace(/\n{3,}/g, '\n\n') // collapse 3+ newlines to max 2
            .trim();
    }

    private mkId(): string {
        try { if ((crypto as any)?.randomUUID) return (crypto as any).randomUUID(); } catch {}
        return 'tech-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
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

    /** Template shown to the model to keep the TECH shape consistent */
    private techSpecTemplate(): string {
        return `SPEC FORMAT (TXT)
HEADER
Title: <human title>
Initials: <short code>
Icon: <font-awesome or text>
Default Role Flags: defaultRole=false, anonymousRole=false, transitionRole=false

ROLES
List each role by human name (e.g., “Client”, “Loan Officer”, “System”).

DATA FIELDS
Name: <human name>
Type: one of [Text, Number, Date, Boolean, Enumeration Map, Multichoice]
Title (optional): <human label>
Options (for enumerations): key=value or list of labels

TASKS (TRANSITIONS)
Name: <human name>
Performer: [role or userlist(...)]
Incoming From: [start | place names | previous tasks]
Outgoing To: [next tasks or end]
Form:
  Field “X”: editable, required=yes
Actions (optional):
  call_webservice(...)
  set(...)
  show(...) / hide(...)

ACTIONS (FUNCTIONAL BEHAVIOR)
Name: <human name>
Trigger: [on-task-start | on-field-change(...) | on-task-finish]
Effect:
  set(...)
  compute(...)
  route_to(...)

ROUTING RULES
Describe sequential order and conditional paths.`;
    }
}
