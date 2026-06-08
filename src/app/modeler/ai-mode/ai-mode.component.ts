import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AiAssistantContextEnum, AiAssistantService} from '../services/ai-assistant/ai-assistant.service';

/**
 * AI assistant mode. Reads the optional `?context=` query parameter so that
 * other modes can pass a hint about the current canvas selection when opening AI.
 */
@Component({
    selector: 'nab-ai-mode',
    templateUrl: './ai-mode.component.html',
    styleUrls: ['./ai-mode.component.scss']
})
export class AiModeComponent implements OnInit {

    constructor(
        private route: ActivatedRoute,
        private aiAssistantService: AiAssistantService
    ) {}

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            const ctx = params.get('context');
            if (!ctx) return;
            const enumKey = Object.keys(AiAssistantContextEnum)
                .find(k => AiAssistantContextEnum[k as keyof typeof AiAssistantContextEnum] === ctx
                    || k === ctx);
            if (enumKey) {
                this.aiAssistantService.assistantContext.isGlobal = false;
                this.aiAssistantService.assistantContext.localContext.currentContext =
                    AiAssistantContextEnum[enumKey as keyof typeof AiAssistantContextEnum];
            }
        });
    }
}
