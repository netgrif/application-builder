// src/app/dialogs/dialog-assistant/openai-http.service.ts
import { Injectable } from '@angular/core';

export abstract class OpenAiService {
    abstract generate(args: {
        system: string;
        user: string;
        model: string;
        maxOutputTokens?: number;
    }): Promise<{ text: string; tokens?: number; rateInfo?: string }>;
}

@Injectable({ providedIn: 'root' })
export class OpenAiHttpService implements OpenAiService {
    // ⚠ Dev-only. For prod, proxy via backend.
    private readonly OPENAI_API_KEY = 'KEY HERE';

    async generate(args: {
        system: string;
        user: string;
        model: string;
        maxOutputTokens?: number;
    }): Promise<{ text: string; tokens?: number; rateInfo?: string }> {
        const body = {
            model: args.model,
            messages: [
                { role: 'system', content: args.system },
                { role: 'user',   content: args.user   },
            ],
            temperature: 0,
            max_tokens: args.maxOutputTokens ?? 2000,
        };

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const rateInfo = [
            res.headers.get('x-ratelimit-remaining-requests'),
            res.headers.get('x-ratelimit-remaining-tokens'),
        ].filter(Boolean).join('/');

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`OpenAI ${res.status}: ${errText || res.statusText}`);
        }

        const json = await res.json();
        const text: string =
            json?.choices?.[0]?.message?.content ??
            json?.choices?.[0]?.text ?? '';

        const tokens: number | undefined = json?.usage?.total_tokens;
        return { text, tokens, rateInfo };
    }
}

/** Public list to use in the UI (best → lowest cost) */
export const PETRIFLOW_MODELS = [
    { id: 'gpt-4.1', label: 'GPT-4.1 (best)', note: 'highest quality, higher cost' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1-mini (balanced)', note: 'good quality, cheaper' },
    { id: 'gpt-4o-mini', label: 'GPT-4o-mini (fastest/cheapest)', note: 'lean context, POC' },
];
