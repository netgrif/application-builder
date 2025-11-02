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

@Injectable({ providedIn: 'root' })
export class ParentBridgeService {
    private targetOrigin = 'http://localhost:4200'; // host (4200)

    call<T = any>(
        method: BridgeCall['method'],
        payload: any,
        timeoutMs = 120_000
    ): Promise<T> {
        const id = `b_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const target = window.parent;

        return new Promise<T>((resolve, reject) => {
            const onMsg = (ev: MessageEvent) => {
                if (ev.origin !== this.targetOrigin) return;
                const data = ev.data as BridgeResponse;
                if (!data || data.type !== 'BRIDGE_RESPONSE' || data.id !== id) return;

                window.removeEventListener('message', onMsg);
                if ((data as any).ok) {
                    resolve((data as any).result as T);
                } else {
                    reject(new Error((data as any).error || 'Bridge error'));
                }
            };

            window.addEventListener('message', onMsg);

            const req: BridgeCall = { type: 'BRIDGE_CALL', id, method, payload };
            target?.postMessage(req, this.targetOrigin);

            setTimeout(() => {
                window.removeEventListener('message', onMsg);
                reject(new Error(`Timeout ${timeoutMs}ms: ${method}`));
            }, timeoutMs);
        });
    }
}
