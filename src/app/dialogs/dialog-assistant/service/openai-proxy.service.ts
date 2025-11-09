import { Injectable } from '@angular/core';
import { OpenAiService } from './openai-http.service';
import { ParentBridgeService } from '../../../services/parent-bridge.service';

@Injectable({ providedIn: 'root' })
export class OpenAiProxyService implements OpenAiService {
    constructor(private bridge: ParentBridgeService) {}

    async generate(args: {
        system: string;
        user: string;
        model?: string;
        maxOutputTokens?: number;
    }): Promise<{ text: string; tokens?: number; rateInfo?: string }> {
        return await this.bridge.call('assistant.generate', args, 120_000);
    }

    //Ak budeš volať wizard zo servera, môžeš doplniť:
    async generateXmlStep(args: {
        step: string;
        tech: unknown;
        skeleton: string;
        model?: string;
        maxOutputTokens?: number;
    }) {
        return await this.bridge.call('assistant.xmlStep', args, 120_000);
    }
}
