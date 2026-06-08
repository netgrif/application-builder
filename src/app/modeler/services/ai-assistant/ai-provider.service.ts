import {Injectable} from '@angular/core';
import {Observable, Subscription, throwError} from 'rxjs';
import {fromFetch} from 'rxjs/fetch';
import {switchMap} from 'rxjs/operators';
import {ChatTurn} from './domain/message-objects';
import {environment} from '../../../../environments/environment';

interface StreamTimeouts {
    requestMs: number;
    idleStreamMs: number;
}

interface StreamRetry {
    attempts: number;
    backoffMs: number;
}

export type AiProviderId = 'claude' | 'openai' | 'gemini';

/** Internal marker so the retry loop can distinguish HTTP failures (already
 *  translated to a friendly message) from raw network errors. */
class HttpError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}

export interface AiProviderConfig {
    provider: AiProviderId;
    model: string;
    apiKey: string;
}

export interface ProviderKeyMap {
    claude?: string;
    openai?: string;
    gemini?: string;
}

interface StreamPaths {
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
    /** Convert one decoded SSE line into a piece of text or null. */
    parseChunk: (rawLine: string) => string | null;
}

const STORAGE_KEY_PROVIDER = 'nab.ai.provider';
const STORAGE_KEY_MODEL = 'nab.ai.model';
const STORAGE_KEY_KEYS = 'nab.ai.keys'; // JSON map { claude, openai, gemini }

const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Provider-agnostic LLM facade.
 *
 * - Caches provider / model / keys in RAM at construction time so every
 *   subsequent access within the session is synchronous. Writes go to both
 *   RAM and localStorage simultaneously.
 * - Emits streamed text chunks as an RxJS Observable so the chat UI can append
 *   tokens as they arrive without waiting for the full response.
 * - No vendor SDKs — everything is a single fetch() per request.
 *
 * NOTE: API keys live in the browser. Each provider must allow browser-origin
 * calls (Anthropic needs `anthropic-dangerous-direct-browser-access: true`).
 * For production deployments, route through a server-side proxy instead.
 */
@Injectable({
    providedIn: 'root'
})
export class AiProviderService {

    // In-memory cache — populated once in the constructor from localStorage,
    // then acts as the single source of truth for the entire app session.
    private cachedProvider: AiProviderId | null = null;
    private cachedModel: string | null = null;
    private cachedKeys: ProviderKeyMap = {};

    constructor() {
        this.cachedProvider = this.readProviderFromStorage();
        this.cachedModel = this.readModelFromStorage();
        this.cachedKeys = this.readKeysFromStorage();
    }

    public configure(provider: AiProviderId, model: string, keys: ProviderKeyMap): void {
        this.cachedProvider = provider;
        this.cachedModel = model;
        this.cachedKeys = {...(keys || {})};
        this.persistAll();
    }

    public setActiveModel(model: string): void {
        this.cachedModel = model;
        this.writeToStorage(STORAGE_KEY_MODEL, model);
    }

    public setActiveProvider(provider: AiProviderId): void {
        this.cachedProvider = provider;
        this.writeToStorage(STORAGE_KEY_PROVIDER, provider);
    }

    public getActiveProvider(): AiProviderId | null {
        return this.cachedProvider;
    }

    public getActiveModel(): string | null {
        return this.cachedModel;
    }

    public getKeys(): ProviderKeyMap {
        // Return a copy so callers cannot accidentally mutate the cache.
        return {...this.cachedKeys};
    }

    public hasKeyForActiveProvider(): boolean {
        const provider = this.cachedProvider;
        if (!provider) return false;
        const k = this.cachedKeys[provider];
        return !!(k && k.trim());
    }

    public getCurrentConfig(): AiProviderConfig | null {
        const provider = this.cachedProvider;
        const model = this.cachedModel;
        if (!provider || !model) return null;
        const apiKey = this.cachedKeys[provider];
        if (!apiKey) return null;
        return {provider, model, apiKey};
    }

    /**
     * Streams an assistant reply for the given conversation.
     * Emits raw text chunks (already concatenable). The observable completes
     * when the provider signals end-of-stream, or errors on HTTP / parse fail.
     *
     * Robustness features:
     *  - **Overall timeout** (`environment.ai.timeouts.requestMs`): if the full
     *    response hasn't arrived in this window, the request is aborted with a
     *    clear "took too long" message. Old generator users reported the chat
     *    sometimes hanging forever — this guarantees it doesn't.
     *  - **Idle-stream watchdog** (`environment.ai.timeouts.idleStreamMs`): if
     *    no chunk arrives for this long mid-stream (proxy died / provider
     *    stalled), we abort. Without this we'd just spin forever.
     *  - **Retry on transient failure** (`environment.ai.retry.attempts`):
     *    network errors and 408/429/5xx/529 responses are retried up to N times
     *    with linear back-off before bubbling the error to the user. The user
     *    only ever sees the *last* failure, so a flaky network is invisible.
     *    First successful chunk disables retry (we never re-send a half-streamed
     *    request — that would double-bill the user).
     */
    public stream(history: ChatTurn[], systemPrompt: string): Observable<string> {
        const cfg = this.getCurrentConfig();
        if (!cfg) {
            return throwError(() => new Error(
                'No AI provider configured. Open settings and choose a provider, model and API key.'
            ));
        }
        const paths = this.buildRequest(cfg, history, systemPrompt);
        const timeouts = environment.ai?.timeouts ?? {requestMs: 90_000, idleStreamMs: 30_000};
        const retry = environment.ai?.retry ?? {attempts: 2, backoffMs: 1200};
        return this.streamWithRetry(cfg, paths, timeouts, retry);
    }

    /**
     * Orchestrates retries across {@link streamSingleAttempt}. Retries only when:
     *  - no chunk has been emitted yet (we never re-send a half-streamed request),
     *  - the failure is a retriable HTTP status (5xx, 408, 429…) or a transient network error,
     *  - we still have attempts left.
     * Linear back-off scales with attempt index.
     */
    private streamWithRetry(
        cfg: AiProviderConfig, paths: StreamPaths, timeouts: StreamTimeouts, retry: StreamRetry
    ): Observable<string> {
        return new Observable<string>(observer => {
            let cancelled = false;
            let receivedAnyChunk = false;
            let currentSub: Subscription | null = null;
            let backoffTimer: ReturnType<typeof setTimeout> | null = null;

            const runAttempt = (attemptIdx: number) => {
                if (cancelled) return;
                currentSub = this.streamSingleAttempt(cfg, paths, timeouts).subscribe({
                    next: chunk => {
                        receivedAnyChunk = true;
                        observer.next(chunk);
                    },
                    error: err => {
                        if (cancelled) return;
                        const canRetry =
                            !receivedAnyChunk
                            && attemptIdx < retry.attempts
                            && this.isRetriableError(err);
                        if (canRetry) {
                            backoffTimer = setTimeout(
                                () => runAttempt(attemptIdx + 1),
                                retry.backoffMs * (attemptIdx + 1)
                            );
                        } else {
                            observer.error(err);
                        }
                    },
                    complete: () => {
                        if (!cancelled) observer.complete();
                    }
                });
            };

            runAttempt(0);

            return () => {
                cancelled = true;
                if (backoffTimer) clearTimeout(backoffTimer);
                currentSub?.unsubscribe();
            };
        });
    }

    /**
     * One end-to-end attempt: POST via {@link fromFetch}, then hand the response off to
     * {@link consumeSseStream}. Owns the overall-request timer and the idle-stream watchdog;
     * the watchdog is reset on every parsed chunk so it only fires when the provider really stalls.
     * AbortError (from teardown or timers) silently completes — no error bubbles to the user.
     */
    private streamSingleAttempt(
        cfg: AiProviderConfig, paths: StreamPaths, timeouts: StreamTimeouts
    ): Observable<string> {
        return new Observable<string>(observer => {
            const abort = new AbortController();
            let settled = false;
            let idleTimer: ReturnType<typeof setTimeout> | null = null;

            const finish = (fn: () => void) => {
                if (settled) return;
                settled = true;
                if (overallTimer) clearTimeout(overallTimer);
                if (idleTimer) clearTimeout(idleTimer);
                fn();
            };

            const overallTimer = setTimeout(() => {
                abort.abort();
                finish(() => observer.error(new Error(
                    `${this.providerLabel(cfg.provider)} took longer than ` +
                    `${Math.round(timeouts.requestMs / 1000)}s to respond. ` +
                    `Try a smaller model or simpler prompt.`
                )));
            }, timeouts.requestMs);

            const resetIdleWatchdog = () => {
                if (idleTimer) clearTimeout(idleTimer);
                idleTimer = setTimeout(() => {
                    abort.abort();
                    finish(() => observer.error(new Error(
                        `${this.providerLabel(cfg.provider)} stopped sending data ` +
                        `for ${Math.round(timeouts.idleStreamMs / 1000)}s. ` +
                        `The connection looked stalled — please try again.`
                    )));
                }, timeouts.idleStreamMs);
            };

            const sub = fromFetch(paths.url, {
                method: 'POST',
                headers: paths.headers,
                body: JSON.stringify(paths.body),
                signal: abort.signal
            }).pipe(
                switchMap(res => this.consumeSseStream(res, paths, cfg, resetIdleWatchdog))
            ).subscribe({
                next: chunk => observer.next(chunk),
                error: err => {
                    if (err?.name === 'AbortError') {
                        finish(() => observer.complete());
                    } else if (err instanceof HttpError) {
                        finish(() => observer.error(err));
                    } else {
                        finish(() => observer.error(new Error(this.friendlyNetworkError(cfg.provider, err))));
                    }
                },
                complete: () => finish(() => observer.complete())
            });

            return () => {
                if (!settled) {
                    settled = true;
                    if (overallTimer) clearTimeout(overallTimer);
                    if (idleTimer) clearTimeout(idleTimer);
                }
                abort.abort();
                sub.unsubscribe();
            };
        });
    }

    /**
     * Consumes the Response body as Server-Sent Events: splits on `\n`, ignores
     * comments and `[DONE]`, hands each `data:` payload to the provider-specific
     * parseChunk. Malformed payloads are skipped so one bad event cannot kill the stream.
     */
    private consumeSseStream(
        res: Response, paths: StreamPaths, cfg: AiProviderConfig, onChunk: () => void
    ): Observable<string> {
        if (!res.ok) {
            return new Observable<string>(observer => {
                res.text().catch(() => '').then(errText => {
                    observer.error(new HttpError(
                        res.status,
                        this.friendlyHttpError(cfg.provider, res.status, res.statusText, errText)
                    ));
                });
            });
        }
        if (!res.body) {
            return throwError(() => new Error(
                `${this.providerLabel(cfg.provider)} returned an empty response body.`
            ));
        }
        return new Observable<string>(observer => {
            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let cancelled = false;

            const pump = async () => {
                try {
                    while (!cancelled) {
                        const {value, done} = await reader.read();
                        if (cancelled) return;
                        if (done) break;
                        buffer += decoder.decode(value, {stream: true});
                        let nlIndex: number;
                        while ((nlIndex = buffer.indexOf('\n')) !== -1) {
                            const line = buffer.slice(0, nlIndex).replace(/\r$/, '');
                            buffer = buffer.slice(nlIndex + 1);
                            if (!line || !line.startsWith('data:')) continue;
                            const payload = line.slice(5).trim();
                            if (!payload || payload === '[DONE]') continue;
                            try {
                                const chunk = paths.parseChunk(payload);
                                if (chunk) {
                                    onChunk();
                                    observer.next(chunk);
                                }
                            } catch {
                                // malformed event — skip rather than tear down the stream
                            }
                        }
                    }
                    if (!cancelled) observer.complete();
                } catch (err) {
                    if (!cancelled) observer.error(err);
                }
            };

            pump();

            return () => {
                cancelled = true;
                reader.cancel().catch(() => {});
            };
        });
    }

    /** True if the error suggests the request might succeed on retry. */
    private isRetriableError(err: unknown): boolean {
        if (err instanceof HttpError) return this.isRetriableStatus(err.status);
        return this.isTransientNetworkError(err);
    }

    private isRetriableStatus(status: number): boolean {
        return status === 408 || status === 425 || status === 429 ||
               status === 500 || status === 502 || status === 503 || status === 504 || status === 529;
    }

    private isTransientNetworkError(err: unknown): boolean {
        const msg = err instanceof Error ? err.message : String(err ?? '');
        return /network|failed to fetch|load failed|ECONNRESET|ETIMEDOUT|ENETUNREACH|socket hang up/i.test(msg);
    }

    /**
     * Translates raw provider HTTP errors into actionable messages for the user.
     * Falls back to the original payload when the status code is unfamiliar so
     * we never lose diagnostic information.
     */
    private friendlyHttpError(provider: AiProviderId, status: number, statusText: string, body: string): string {
        const providerLabel = this.providerLabel(provider);
        const detail = this.extractProviderMessage(body) || statusText || '';
        const detailSuffix = detail ? ` (${detail})` : '';
        switch (status) {
            case 400:
                return `${providerLabel} rejected the request as malformed${detailSuffix}. The current conversation may be too long — try resetting the chat.`;
            case 401:
            case 403:
                return `${providerLabel} rejected the API key. Open Settings and verify the key is valid and still active.`;
            case 404:
                return `${providerLabel} could not find the selected model. Pick a different model in Settings.`;
            case 408:
            case 504:
                return `${providerLabel} timed out before answering. Try again or pick a smaller model.`;
            case 413:
                return `The request is too large for ${providerLabel}. Trim the canvas or reset the chat history.`;
            case 429:
                return `${providerLabel} rate limit reached. Wait a moment and try again — this is enforced by the provider, not the app.`;
            case 500:
            case 502:
            case 503:
                return `${providerLabel} is temporarily unavailable (HTTP ${status}). Try again in a moment.`;
            case 529:
                return `${providerLabel} is overloaded. Try again in a moment.`;
            default:
                return `${providerLabel} returned HTTP ${status}${detailSuffix}.`;
        }
    }

    private friendlyNetworkError(provider: AiProviderId, err: unknown): string {
        const providerLabel = this.providerLabel(provider);
        const msg = err instanceof Error ? err.message : String(err);
        if (/network|failed to fetch|load failed/i.test(msg)) {
            return `Could not reach ${providerLabel}. Check your internet connection and try again.`;
        }
        return `${providerLabel} request failed: ${msg}`;
    }

    private providerLabel(provider: AiProviderId): string {
        switch (provider) {
            case 'claude': return 'Claude';
            case 'openai': return 'OpenAI';
            case 'gemini': return 'Gemini';
        }
    }

    /** Best-effort extraction of an error message from a provider JSON payload. */
    private extractProviderMessage(body: string): string {
        if (!body) return '';
        try {
            const json = JSON.parse(body);
            return json?.error?.message || json?.error || json?.message || '';
        } catch {
            return body.length > 160 ? body.slice(0, 160) + '…' : body;
        }
    }

    // ─── Storage helpers ─────────────────────────────────────────────────────

    private readProviderFromStorage(): AiProviderId | null {
        try {
            return (localStorage.getItem(STORAGE_KEY_PROVIDER) as AiProviderId) || null;
        } catch {
            return null;
        }
    }

    private readModelFromStorage(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEY_MODEL);
        } catch {
            return null;
        }
    }

    private readKeysFromStorage(): ProviderKeyMap {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_KEYS);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            // sanitize — drop null/undefined values
            const out: ProviderKeyMap = {};
            if (typeof parsed?.claude === 'string') out.claude = parsed.claude;
            if (typeof parsed?.openai === 'string') out.openai = parsed.openai;
            if (typeof parsed?.gemini === 'string') out.gemini = parsed.gemini;
            return out;
        } catch {
            return {};
        }
    }

    private writeToStorage(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch {
            // localStorage may be disabled — best effort
        }
    }

    private persistAll(): void {
        try {
            if (this.cachedProvider) localStorage.setItem(STORAGE_KEY_PROVIDER, this.cachedProvider);
            if (this.cachedModel)    localStorage.setItem(STORAGE_KEY_MODEL, this.cachedModel);
            localStorage.setItem(STORAGE_KEY_KEYS, JSON.stringify(this.cachedKeys));
        } catch {
            // best effort
        }
    }

    // ─── Request building ────────────────────────────────────────────────────

    private buildRequest(cfg: AiProviderConfig, history: ChatTurn[], systemPrompt: string): StreamPaths {
        switch (cfg.provider) {
            case 'claude':  return this.buildClaude(cfg, history, systemPrompt);
            case 'openai':  return this.buildOpenAi(cfg, history, systemPrompt);
            case 'gemini':  return this.buildGemini(cfg, history, systemPrompt);
        }
    }

    // ─── Claude (Anthropic Messages API) ─────────────────────────────────────

    private buildClaude(cfg: AiProviderConfig, history: ChatTurn[], systemPrompt: string): StreamPaths {
        return {
            url: 'https://api.anthropic.com/v1/messages',
            headers: {
                'content-type': 'application/json',
                'x-api-key': cfg.apiKey,
                'anthropic-version': ANTHROPIC_VERSION,
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: {
                model: cfg.model,
                max_tokens: 16000,
                stream: true,
                system: [
                    {
                        type: 'text',
                        text: systemPrompt,
                        // The reference guide is large and rarely changes —
                        // ephemeral cache means subsequent turns are cheap.
                        cache_control: {type: 'ephemeral'}
                    }
                ],
                messages: history.map(t => ({role: t.role, content: t.content}))
            },
            parseChunk: (raw: string) => {
                const ev = JSON.parse(raw);
                if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
                    return ev.delta.text || '';
                }
                return null;
            }
        };
    }

    // ─── OpenAI (Chat Completions) ───────────────────────────────────────────

    private buildOpenAi(cfg: AiProviderConfig, history: ChatTurn[], systemPrompt: string): StreamPaths {
        return {
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${cfg.apiKey}`
            },
            body: {
                model: cfg.model,
                stream: true,
                messages: [
                    {role: 'system', content: systemPrompt},
                    ...history.map(t => ({role: t.role, content: t.content}))
                ]
            },
            parseChunk: (raw: string) => {
                const ev = JSON.parse(raw);
                const delta = ev.choices?.[0]?.delta?.content;
                return typeof delta === 'string' ? delta : null;
            }
        };
    }

    // ─── Gemini (Google AI Studio streamGenerateContent) ─────────────────────

    private buildGemini(cfg: AiProviderConfig, history: ChatTurn[], systemPrompt: string): StreamPaths {
        return {
            url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(cfg.apiKey)}`,
            headers: {
                'content-type': 'application/json'
            },
            body: {
                systemInstruction: {parts: [{text: systemPrompt}]},
                contents: history.map(t => ({
                    role: t.role === 'assistant' ? 'model' : 'user',
                    parts: [{text: t.content}]
                }))
            },
            parseChunk: (raw: string) => {
                const ev = JSON.parse(raw);
                const parts = ev.candidates?.[0]?.content?.parts;
                if (!parts) return null;
                return parts.map((p: {text?: string}) => p.text || '').join('') || null;
            }
        };
    }
}
