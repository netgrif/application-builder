// src/app/dialogs/dialog-assistant/tech/tech-editor.facade.ts
import { TechAssistantService } from './tech-assistant.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DraftState } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class TechEditorFacade {
    readonly draft$: Observable<DraftState | null>;

    constructor(private readonly techSvc: TechAssistantService) {
        this.draft$ = this.techSvc.draftState();
    }

    /** Create a TECH spec from a BRD text */
    createFromBrd(brd: string) {
        return this.techSvc.createFromBrd(brd);
    }

    /** Refine the current TECH spec using an instruction and the current TECH text */
    refine(instruction: string, currentTech: string) {
        return this.techSvc.refineTech(instruction, currentTech);
    }

    /** Build a high-quality “Edit TECH” seed for the composer */
    seed(v: string) {
        return this.techSvc.makeEditSeed(v);
    }
}
