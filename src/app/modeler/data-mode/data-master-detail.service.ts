import {Injectable} from '@angular/core';
import {DataVariable} from '@netgrif/petriflow';
import {ModelService} from '../services/model/model.service';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DataMasterDetailService {
    private _selected: BehaviorSubject<DataVariable>;

    constructor(private _modelService: ModelService) {
        this._selected = new BehaviorSubject<DataVariable>(undefined);
    }

    public select(data: DataVariable): void {
        this._selected.next(data);
    }

    public getSelected(): DataVariable {
        return this._selected.value;
    }

    public selectedSubject(): BehaviorSubject<DataVariable> {
        return this._selected;
    }

    public get allData(): Array<DataVariable> {
        return this._modelService.model.getDataSet();
    }

    public create(): DataVariable {
        throw new Error('Method not implemented.');
    }

    public delete(item: DataVariable): void {
        throw new Error('Method not implemented.');
    }
}
