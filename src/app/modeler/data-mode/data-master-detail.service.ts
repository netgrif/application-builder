import {Injectable} from '@angular/core';
import {DataType, DataVariable} from '@netgrif/petriflow';
import {ModelService} from '../services/model/model.service';
import {AbstractMasterDetailService} from '../components/master-detail/abstract-master-detail.service';
import {Sort} from '@angular/material/sort';
import {HistoryService} from '../services/history/history.service';

@Injectable({
    providedIn: 'root'
})
export class DataMasterDetailService extends AbstractMasterDetailService<DataVariable> {

    constructor(protected _modelService: ModelService,
                protected _historyService: HistoryService) {
        super();
    }

    public get allData(): Array<DataVariable> {
        return this._modelService.model.getDataSet();
    }

    public create(): DataVariable {
        const data = new DataVariable(this._modelService.nextDataId(), DataType.TEXT);
        this._modelService.model.addData(data);
        this._create.next(data);
        this._historyService.save(`DataVariable ${data.id} has been created.`)
        return data;
    }

    public delete(item: DataVariable): void {
        this._modelService.removeDataVariable(item);
        this._delete.next(item);
        this._historyService.save(`DataVariable ${item.id} has been deleted.`)
    }

    public duplicate(item: DataVariable): DataVariable {
        const data = item.clone();
        data.id = this._modelService.nextDataId();
        this._modelService.model.addData(data);
        this._create.next(data);
        this._historyService.save(`DataVariable ${data.id} has been created.`)
        return data;
    }

    public getAllDataSorted(event: Sort) {
        return this.allData.toSorted((a: any, b: any) => {
            const isAsc = event.direction === 'asc';
            switch (event.active) {
                case 'name':
                    return this.compare(a.title.value, b.title.value, isAsc);
                default:
                    return this.compare(a.id, b.id, isAsc);
            }
        });
    }
}
