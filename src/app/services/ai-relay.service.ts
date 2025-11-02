import { Injectable, NgZone } from '@angular/core';

interface AiGeneratePayload {
    system: string;
    user: string;
    model?: string;
    maxOutputTokens?: number;
    threadId?: string;
}

@Injectable({ providedIn: 'root' })
export class AiRelayService {
    /** URL tvojho backendu – prispôsob podľa prostredia */
    private readonly API = '/api/ai/generate';

    constructor(private zone: NgZone) {}

    /** Zavolá Java backend a vráti text + metriky */
    async generate(body: AiGeneratePayload): Promise<{ text: string; tokens?: number; rateInfo?: string }> {
        const res = await fetch(this.API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.text().catch(() => '');
            throw new Error(`AI backend ${res.status}: ${err || res.statusText}`);
        }
        return res.json();
    }

    /** Bezpečný wrapper na postMessage od 4201 (iframe) */
    bindWindowMessageRelay(allowedChildOrigin = 'http://localhost:4201') {
        const handler = async (evt: MessageEvent) => {
            if (evt.origin !== allowedChildOrigin) return;
            const data = evt.data || {};
            if (data?.type !== 'AI_GENERATE') return;

            try {
                const payload = data.payload as AiGeneratePayload;
                const start = performance.now();
                const result = await this.generate(payload);
                const latency = Math.round(performance.now() - start);

                (evt.source as WindowProxy)?.postMessage(
                    { type: 'AI_RESULT', payload: { ...result, latencyMs: latency } },
                    allowedChildOrigin
                );
            } catch (e: any) {
                (evt.source as WindowProxy)?.postMessage(
                    { type: 'AI_ERROR', payload: { message: e?.message || String(e) } },
                    allowedChildOrigin
                );
            }
        };

        // zaruč, že registrácia beží v Angular zone (kvôli prípadným UI reakciám)
        this.zone.runOutsideAngular(() => {
            window.addEventListener('message', handler);
        });

        return () => window.removeEventListener('message', handler);
    }
}
