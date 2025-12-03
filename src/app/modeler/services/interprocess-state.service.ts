import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface InterprocessState {
    identifier?: string | null;
    interprocess: any | null;
}

@Injectable({ providedIn: 'root' })
export class InterprocessStateService {
    private readonly _state$ = new BehaviorSubject<InterprocessState | null>(null);

    readonly state$: Observable<InterprocessState | null> = this._state$.asObservable();

    get snapshot(): InterprocessState | null {
        return this._state$.value;
    }

    setState(state: InterprocessState | null): void {
        this._state$.next(state);
    }
}
