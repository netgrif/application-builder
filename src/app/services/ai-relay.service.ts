import { Injectable, NgZone } from '@angular/core';

interface AiGeneratePayload {
    system: string;
    user: string;
    model?: string;
    maxOutputTokens?: number;
    threadId?: string;
}

/** Runtime helpers (bez hardcodu) */
function resolveParentOrigin(): string {
    const w = window as any;
    if (typeof w.__PARENT_ORIGIN__ === 'string' && w.__PARENT_ORIGIN__) return w.__PARENT_ORIGIN__;
    try {
        if (document.referrer) {
            const u = new URL(document.referrer);
            return u.origin;
        }
    } catch { /* ignore */ }
    return window.location.origin; // single-open fallback
}

function resolveApiBase(): string {
    const w = window as any;
    if (typeof w.__API_BASE__ === 'string' && w.__API_BASE__) return w.__API_BASE__;
    // default: rovnaký origin -> /api
    return '/api';
}

@Injectable({ providedIn: 'root' })
export class AiRelayService {
    /** Backend base (runtime overridable cez window.__API_BASE__) */
    private readonly API_BASE = resolveApiBase();

    /** Základný endpoint na generovanie – ladí s tvojím Spring controllerom */
    private readonly GENERATE_URL = `${this.API_BASE}/assistant/generate`;

    constructor(private zone: NgZone) {}

    /** Zavolá Java backend a vráti text + metriky */
    async generate(
        body: AiGeneratePayload
    ): Promise<{ text: string; tokens?: number; rateInfo?: string }> {
        const res = await fetch(this.GENERATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // prenesie NAE session cookie
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.text().catch(() => '');
            throw new Error(`AI backend ${res.status}: ${err || res.statusText}`);
        }
        return res.json();
    }

    /** Relay pre postMessage z 4201 -> (4200/parent) -> backend.
     *  - Dynamicky zistí povolený origin (parent 4200) alebo fallbackne na single-open.
     *  - Žiadny hardcode localhost.
     */
    bindWindowMessageRelay(allowedChildOrigin?: string) {
        const parentOrigin = resolveParentOrigin();
        const expectedOrigin = allowedChildOrigin || parentOrigin;

        const handler = async (evt: MessageEvent) => {
            // Ak sme single-open (parent === self), nekontroluj striktne origin.
            const isSingleOpen = window.parent === window;
            if (!isSingleOpen && evt.origin !== expectedOrigin) return;

            const data = evt.data || {};
            if (data?.type !== 'AI_GENERATE') return;

            try {
                const payload = data.payload as AiGeneratePayload;
                const start = performance.now();
                const result = await this.generate(payload);
                const latency = Math.round(performance.now() - start);

                (evt.source as WindowProxy)?.postMessage(
                    { type: 'AI_RESULT', payload: { ...result, latencyMs: latency } },
                    isSingleOpen ? '*' : evt.origin
                );
            } catch (e: any) {
                (evt.source as WindowProxy)?.postMessage(
                    { type: 'AI_ERROR', payload: { message: e?.message || String(e) } },
                    isSingleOpen ? '*' : evt.origin
                );
            }
        };

        // registrácia mimo Angular zóny, nech nezbytočne nespúšťame detekciu zmien
        this.zone.runOutsideAngular(() => {
            window.addEventListener('message', handler);
        });

        return () => window.removeEventListener('message', handler);
    }
}
