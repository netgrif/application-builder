// src/app/dialogs/dialog-assistant/utils/message-helpers.ts
import { ChatMsg } from '../models/chat.models';

/** Generate a stable unique id (uses crypto.randomUUID when available). */
export const mkId = (): string => {
    try {
        // Browser / modern Node
        if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
            return (crypto as any).randomUUID();
        }
    } catch {
        /* no-op */
    }
    // Fallback: time + random
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
};

/** Current timestamp helper to keep call sites tidy. */
export const now = (): Date => new Date();

/** Angular *ngFor trackBy for chat messages. */
export const trackByMsgFn = (_: number, m: ChatMsg): string => m.id;
