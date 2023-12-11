import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {PetriNet} from '@netgrif/petriflow';

@Injectable({
    providedIn: 'root'
})
export class ModelerTabsService {
    openTab: Subject<PetriNet>;

    constructor() {
        this.openTab = new Subject<PetriNet>();
    }
}
