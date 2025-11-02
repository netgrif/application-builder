import { Injectable } from '@angular/core';

type BridgeCall = {
    type: 'BRIDGE_CALL';
    id: string;
    method: 'assistant.generate' | 'assistant.xmlStep';
    payload: any;
};

type BridgeResponse =
    | { type: 'BRIDGE_RESPONSE'; id: string; ok: true; result: any }
    | { type: 'BRIDGE_RESPONSE'; id: string; ok: false; error: string };

/** Zistí origin rodiča (4200) bez hardcodu.
 *  Poradie:
 *   1) window.__PARENT_ORIGIN__ (ak nastavíš v index.html)
 *   2) document.referrer (extrahuje origin)
 *   3) fallback na rovnaký origin (ak je otvorený samostatne)
 */
function resolveParentOrigin(): string {
    const w = window as any;
    if (typeof w.__PARENT_ORIGIN__ === 'string' && w.__PARENT_ORIGIN__) {
        return w.__PARENT_ORIGIN__;
    }
    try {
        if (document.referrer) {
            const u = new URL(document.referrer);
            return u.origin;
        }
    } catch {
        /* ignore */
    }
    return window.location.origin; // single-open fallback
}

@Injectable({ providedIn: 'root' })
export class ParentBridgeService {
    private targetOrigin = resolveParentOrigin();

    /** Na debug: v prípade potreby si vieš overiť, kam posielame správy */
    getTargetOrigin(): string {
        return this.targetOrigin;
    }

    call<T = any>(
        method: BridgeCall['method'],
        payload: any,
        timeoutMs = 120_000
    ): Promise<T> {
        const id = `b_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const target = window.parent;

        return new Promise<T>((resolve, reject) => {
            const onMsg = (ev: MessageEvent) => {
                // Ak nie je parent (otvorené samostatne), nefiltrujeme origin – ale skontrolujeme id.
                const hasParent = window.parent !== window;

                if (hasParent) {
                    // Správa musí prísť z očakávaného originu a od parent okna
                    if (ev.origin !== this.targetOrigin) return;
                    if (ev.source !== window.parent) return;
                }

                const data = ev.data as BridgeResponse;
                if (!data || data.type !== 'BRIDGE_RESPONSE' || data.id !== id) return;

                window.removeEventListener('message', onMsg);
                clearTimeout(timer);
                if ((data as any).ok) {
                    resolve((data as any).result as T);
                } else {
                    reject(new Error((data as any).error || 'Bridge error'));
                }
            };

            window.addEventListener('message', onMsg);

            const req: BridgeCall = { type: 'BRIDGE_CALL', id, method, payload };

            try {
                // Ak máme parent a poznáme origin, používame striktne targetOrigin.
                if (window.parent !== window) {
                    target?.postMessage(req, this.targetOrigin);
                } else {
                    // Samostatne otvorený builder – cieľ je rovnaké okno.
                    window.postMessage(req, window.location.origin);
                }
            } catch {
                // Fallback v úplne hraničných prípadoch (nemalo by byť potrebné)
                target?.postMessage(req, '*');
            }

            const timer = setTimeout(() => {
                window.removeEventListener('message', onMsg);
                reject(new Error(`Timeout ${timeoutMs}ms: ${method}`));
            }, timeoutMs);

            // Ak by sa okno zatvorilo, nech nezostane visieť timeout
            window.addEventListener('unload', () => clearTimeout(timer), { once: true });
        });
    }
}
