import {Injectable} from '@angular/core';
import {MatSidenav, MatSidenavContent} from '@angular/material/sidenav';
import {ReplaySubject} from 'rxjs';
import {Router} from '@angular/router';
import {AiAssistantActionContextEnum, AiAssistantContextEnum, AiAssistantService} from './ai-assistant.service';

/**
 * Backwards-compatible facade for the old AI sidenav drawer.
 *
 * The drawer is gone in Phase 1 — AI Assistant is a routed mode at
 * /modeler/ai. Existing call sites that invoked `openAiAssistant(...)` to pop the
 * overlay now navigate to the AI route, passing the context hint as a query
 * parameter so the AI mode can preset its assistantContext.
 *
 * The methods that used to manage scrollbar visibility and drawer references
 * are kept as no-ops so legacy callers don't break.
 */
@Injectable({
    providedIn: 'root'
})
export class ViewHelperService {

    private appContentReference: MatSidenavContent;

    public scrollSubject: ReplaySubject<boolean> = new ReplaySubject(1);

    constructor(
        private router: Router,
        private aiAssistantService: AiAssistantService
    ) {}

    public openAiAssistant(isGlobal: boolean = true,
                       stepContext: AiAssistantContextEnum = null,
                       actionContext: AiAssistantActionContextEnum = null): void {
        // Preset the AI assistant state so the mode can render with the hint.
        this.aiAssistantService.assistantContext.isGlobal = isGlobal;
        this.aiAssistantService.assistantContext.localContext.currentContext = stepContext;
        this.aiAssistantService.assistantContext.localContext.actionContext  = actionContext;

        const queryParams: any = {};
        if (stepContext) queryParams.context = stepContext;
        if (actionContext) queryParams.action = actionContext;

        this.router.navigate(['/modeler/ai'], {queryParams});
        this.scrollSubject.next(true);
    }

    public hideGlobalScrollbar(): void {
        this.appContentReference?.getElementRef().nativeElement.style.setProperty('overflow', 'hidden', 'important');
    }

    public showGlobalScrollbar(): void {
        this.appContentReference?.getElementRef().nativeElement.style.setProperty('overflow', 'auto', 'important');
    }

    /** No-op kept for backwards compatibility — the drawer is gone. */
    public setDrawerReference(_drawer: MatSidenav | null): void {
        // intentionally empty
    }

    /** Always false now — there is no drawer. */
    public drawerReferenceIsSet(): boolean {
        return false;
    }

    public setAppContentReference(appContent: MatSidenavContent): void {
        this.appContentReference = appContent;
    }
}
