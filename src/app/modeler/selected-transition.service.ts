import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SelectedTransitionService {

    private _id: string;

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }
}
