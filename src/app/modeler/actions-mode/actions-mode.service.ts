import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ActionsModeService {
    eventData: BehaviorSubject<string>;

    constructor() {
        this.eventData = new BehaviorSubject('dataVariable');
    }
}
