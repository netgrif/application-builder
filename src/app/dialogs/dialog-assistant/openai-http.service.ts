import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Matches the abstract OpenAiService used by the dialog. */
export abstract class OpenAiService {
    abstract generate(args: {
        system: string;
        user: string;
        model?: string;
        maxOutputTokens?: number;
    }): Promise<{ text: string; tokens?: number; rateInfo?: string }>;
}

/** Public list for your model picker (best → cheapest). */
export const PETRIFLOW_MODELS = [
    { id: 'gpt-4.1',      label: 'GPT-4.1 (best)',          note: 'highest quality, higher cost' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1-mini (balanced)', note: 'good quality, cheaper' },
    { id: 'gpt-4o-mini',  label: 'GPT-4o-mini (cheap/fast)', note: 'lean context, POC' },
];

@Injectable({ providedIn: 'root' })
export class OpenAiHttpService implements OpenAiService {
    private readonly API_KEY = (environment as any).openaiApiKey?.trim();
    private readonly VECTOR_STORE_ID = (environment as any).openaiVectorStoreId?.trim();
    private readonly DEFAULT_MODEL = (environment as any).openaiDefaultModel || 'gpt-4.1-mini';

    async generate(args: {
        system: string;
        user: string;
        model?: string;
        maxOutputTokens?: number;
    }): Promise<{ text: string; tokens?: number; rateInfo?: string }> {
        if (!this.API_KEY) throw new Error('Missing OpenAI API key (environment.openaiApiKey).');

        const model = (args.model || this.DEFAULT_MODEL).trim();
        const temperature = 0;
        const max_output_tokens = args.maxOutputTokens ?? 1024;

        // Responses API input shape: input[].content[].type MUST be "input_text"
        const input = [
            {
                role: 'system',
                content: [{ type: 'input_text', text: args.system }],
            },
            {
                role: 'user',
                content: [{ type: 'input_text', text: args.user }],
            },
        ];

        const useFileSearch = !!this.VECTOR_STORE_ID;

        // Some orgs require this beta header to route tools with Responses API
        const baseHeaders: Record<string, string> = {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
        };

        // Helper: parse Responses JSON → text + tokens
        const parseResponsesJson = (json: any) => {
            // Outputs can appear as output_text items in output[].content[]
            const blocks = Array.isArray(json?.output) ? json.output : [];
            let text = '';
            for (const b of blocks) {
                const content = Array.isArray(b?.content) ? b.content : [];
                for (const c of content) {
                    if (c?.type === 'output_text' && typeof c?.text === 'string') {
                        text += (text ? '\n' : '') + c.text;
                    }
                }
            }
            if (!text && typeof json?.output_text === 'string') text = json.output_text;

            let tokens: number | undefined;
            const u = json?.usage;
            if (u) {
                if (typeof u.total_tokens === 'number') tokens = u.total_tokens;
                else if (typeof u.input_tokens === 'number' && typeof u.output_tokens === 'number') {
                    tokens = u.input_tokens + u.output_tokens;
                } else if (typeof u.output_tokens === 'number') {
                    tokens = u.output_tokens;
                }
            }
            return { text: String(text ?? ''), tokens };
        };

        const rate = (res: Response) =>
            [res.headers.get('x-ratelimit-remaining-requests'), res.headers.get('x-ratelimit-remaining-tokens')]
                .filter(Boolean)
                .join('/');

        // ---------- Attempt #1: Responses API + File Search (Vector Store) ----------
        if (useFileSearch) {
            const bodyWithFS: any = {
                model,
                input,
                temperature,
                max_output_tokens,
                tools: [{ type: 'file_search' }],
                tool_resources: {
                    file_search: {
                        vector_store_ids: [this.VECTOR_STORE_ID],
                    },
                },
            };

            const res = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: baseHeaders,
                body: JSON.stringify(bodyWithFS),
            });
            const rateInfo = rate(res);

            if (res.ok) {
                const json = await res.json();
                const { text, tokens } = parseResponsesJson(json);
                return { text, tokens, rateInfo };
            }

            const errText = await res.text().catch(() => '');
            // If file-search extras are not accepted, continue to Attempt #2
            if (!/tool_resources|file_search|Unknown parameter/i.test(errText)) {
                throw new Error(`OpenAI ${res.status}: ${errText || res.statusText}`);
            }
        }

        // ---------- Attempt #2: Responses API WITHOUT File Search ----------
        {
            const bodyNoFS: any = { model, input, temperature, max_output_tokens };
            const res = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: baseHeaders,
                body: JSON.stringify(bodyNoFS),
            });
            const rateInfo = rate(res);

            if (res.ok) {
                const json = await res.json();
                const { text, tokens } = parseResponsesJson(json);
                return { text, tokens, rateInfo };
            }

            const errText = await res.text().catch(() => '');
            // If your region/org doesn’t support Responses, fall back to Chat Completions
            if (res.status !== 404 && !/unknown endpoint|path not found|Route not found/i.test(errText)) {
                throw new Error(`OpenAI ${res.status}: ${errText || res.statusText}`);
            }
        }

        // ---------- Attempt #3: Chat Completions fallback (no File Search) ----------
        {
            const messages = [
                { role: 'system', content: args.system },
                { role: 'user', content: args.user },
            ];
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens: max_output_tokens,
                }),
            });
            const rateInfo = rate(res);

            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(`OpenAI ${res.status}: ${errText || res.statusText}`);
            }

            const json = await res.json();
            const text =
                json?.choices?.[0]?.message?.content ??
                json?.choices?.[0]?.text ?? '';
            const tokens = json?.usage?.total_tokens;
            return { text: String(text ?? ''), tokens, rateInfo };
        }
    }
}
