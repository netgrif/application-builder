// src/app/dialogs/dialog-assistant/xml/xml-generator.service.ts
import { Injectable } from '@angular/core';
import { XmlMsg } from '../models/chat.models';
import {OpenAiProxyService} from "../service/openai-proxy.service";

@Injectable({ providedIn: 'root' })
export class XmlGeneratorService {
    constructor(private readonly openai: OpenAiProxyService) {}

    /** Generate Petriflow XML from TECH using `generate({system,user})`. */
    async generate(tech: string): Promise<XmlMsg> {
        const t0 = performance.now();
        try {
            const user = [
                'TECH:',
                tech || '(empty)'
            ].join('\n');

            const { text, tokens } = await this.openai.generate({
                system: this.SYSTEM_XML_FROM_TECH,
                user,
                maxOutputTokens: 3200
            });

            const xml = text?.trim() ?? '';

            const msg: XmlMsg = {
                id: this.mkId(),
                role: 'assistant',
                kind: 'xml',
                xml,
                content: xml,
                tokens,
                timestamp: new Date(),
                latencyMs: Math.round(performance.now() - t0),
            };
            return msg;
        } catch (e: any) {
            throw this.wrapErr(e, 'generate XML');
        }
    }

    // ===== Prompt =====
    private readonly SYSTEM_XML_FROM_TECH =
        `You are a Petriflow code generator.
Convert the TECH specification into valid Petriflow XML.
Return ONLY the XML (no markdown fences, no commentary). Ensure it parses.`;

    // ===== Utils =====
    private mkId(): string {
        try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch {}
        return 'xml-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
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
}
