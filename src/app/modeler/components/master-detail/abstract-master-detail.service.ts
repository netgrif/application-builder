import {BehaviorSubject} from 'rxjs';
import {DataVariable} from '@netgrif/petriflow';
import {Injectable, OnDestroy} from '@angular/core';
import {Sort} from '@angular/material/sort';

@Injectable()
export abstract class AbstractMasterDetailService<T> implements OnDestroy {
    protected _selected: BehaviorSubject<T>;

    protected constructor() {
        this._selected = new BehaviorSubject<T>(undefined);
    }

    public select(data: T): void {
        this._selected.next(data);
    }

    public getSelected(): T {
        return this._selected.value;
    }

    public getSelected$(): BehaviorSubject<T> {
        return this._selected;
    }

    public abstract get allData();
    public abstract create(): T;
    public abstract delete(item: T);
    public abstract getAllDataSorted(event: Sort);

    ngOnDestroy(): void {
        this._selected.complete();
    }
}
