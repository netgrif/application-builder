import {Injectable} from '@angular/core';
import {AbstractMasterDetailService} from '../components/master-detail/abstract-master-detail.service';
import {PetriNet} from '@netgrif/petriflow';
import {Sort} from '@angular/material/sort';
import {HistoryChange} from '../services/history/history-change';
import {HistoryService} from '../services/history/history.service';
import {ModelerConfig} from '../modeler-config';
import {ModelService} from '../services/model/model.service';

@Injectable({
    providedIn: 'root'
})
export class HistoryMasterDetailService extends AbstractMasterDetailService<HistoryChange<PetriNet>> {

    constructor(protected _historyService: HistoryService,
                protected _modelService: ModelService) {
        super();
        this._historyService.historyChange.subscribe(change => {
            if (change.record?.id === this._modelService.model?.id) {
                this._create.next(change);
            }
        });
    }

    public get allData(): Array<HistoryChange<PetriNet>> {
        return this._historyService.history.memory.filter(change =>
            change.record?.id === this._modelService.model?.id
        );
    }

    public create(): HistoryChange<PetriNet> {
        return;
    }

    public delete(item: HistoryChange<PetriNet>): void {
    }

    public duplicate(item: HistoryChange<PetriNet>): HistoryChange<PetriNet> {
        return;
    }

    public getAllDataSorted(event: Sort): Array<HistoryChange<PetriNet>> {
        if (event.direction === 'asc') {
            return this.allData.toReversed();
        }
        return this.allData;
    }

    getSortFromLocalStorage(): Sort {
        return {
            active: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.HISTORY_SORT),
            direction: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.HISTORY_DIRECTION)
        } as Sort;
    }

    setSortToLocalStorage(sort: Sort) {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.HISTORY_SORT, sort.active);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.HISTORY_DIRECTION, sort.direction);
    }
}
