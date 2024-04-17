import {Injectable} from '@angular/core';
import {DataType, DataVariable} from '@netgrif/petriflow';
import {ModelService} from '../services/model/model.service';
import {AbstractMasterDetailService} from '../components/master-detail/abstract-master-detail.service';
import {Sort} from '@angular/material/sort';

@Injectable({
    providedIn: 'root'
})
export class DataMasterDetailService extends AbstractMasterDetailService<DataVariable> {

    constructor(protected _modelService: ModelService) {
        super();
    }

    public get allData(): Array<DataVariable> {
        return this._modelService.model.getDataSet();
    }

    public create(): DataVariable {
        const data = new DataVariable(this._modelService.nextDataId(), DataType.TEXT);
        this._modelService.model.addData(data);
        return data;
    }

    public delete(item: DataVariable): void {
        throw new Error('Method not implemented.');
    }

    public getAllDataSorted(event: Sort) {
        return this.allData.toSorted((a: any, b: any) => {
            const isAsc = event.direction === 'asc';
            switch (event.active) {
                case 'name':
                    return this.compare(a.title.value, b.title.value, isAsc);
                case 'id':
                    return this.compare(a.id, b.id, isAsc);
            }
        });
    }

    protected compare(a: string, b: string, isAsc: boolean): number {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }
}
