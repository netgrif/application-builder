// src/app/dialogs/dialog-assistant/chat-memory.service.ts
import { Injectable } from '@angular/core';

export interface StoredMessage {
    id: number;
    role: 'user' | 'assistant' | 'thinking';
    content: string;
    timestamp: string; // ISO
    latencyMs?: number;
    tokens?: number;
    xml?: string;
    error?: string;
    kind?: 'plan' | 'xml' | 'text';
    summary?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatMemoryService {
    private key(threadId: string) {
        return `ai_assistant_thread:${threadId}`;
    }

    load(threadId: string): StoredMessage[] {
        try {
            const raw = localStorage.getItem(this.key(threadId));
            if (!raw) return [];
            const arr = JSON.parse(raw) as StoredMessage[];
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    save(threadId: string, messages: StoredMessage[]) {
        try {
            localStorage.setItem(this.key(threadId), JSON.stringify(messages));
        } catch {}
    }

    clear(threadId: string) {
        try { localStorage.removeItem(this.key(threadId)); } catch {}
    }
}
