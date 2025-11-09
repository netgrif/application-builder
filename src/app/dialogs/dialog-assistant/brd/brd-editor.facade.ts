import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DraftState } from '../models/chat.models';
import { BrdAssistantService } from './brd-assistant.service';

@Injectable({ providedIn: 'root' })
export class BrdEditorFacade {
    readonly draft$: Observable<DraftState | null>;

    constructor(private readonly brd: BrdAssistantService) {
        this.draft$ = this.brd.draftState();
    }

    /** Create a BRD from a seed text */
    create(seed: string) {
        return this.brd.createBrd(seed);
    }

    /** Refine the current BRD using an instruction and the current BRD text */
    refine(instruction: string, current: string) {
        return this.brd.refineBrd(instruction, current);
    }

    /** Build a high-quality “Edit BRD” seed for the composer */
    seed(v: string) {
        return this.brd.makeEditSeed(v);
    }
}
