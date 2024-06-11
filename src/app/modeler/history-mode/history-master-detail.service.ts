import {Injectable} from '@angular/core';
import {AbstractMasterDetailService} from '../components/master-detail/abstract-master-detail.service';
import {PetriNet} from '@netgrif/petriflow';
import {Sort} from '@angular/material/sort';
import {HistoryChange} from '../services/history/history-change';
import {HistoryService} from '../services/history/history.service';

@Injectable({
    providedIn: 'root'
})
export class HistoryMasterDetailService extends AbstractMasterDetailService<HistoryChange<PetriNet>> {

    constructor(protected _historyService: HistoryService) {
        super();
    }

    public get allData(): Array<HistoryChange<PetriNet>> {
        return this._historyService.history.memory;
    }

    public create(): HistoryChange<PetriNet> {
        return ;
    }

    public delete(item: HistoryChange<PetriNet>): void {
    }

    public duplicate(item: HistoryChange<PetriNet>): HistoryChange<PetriNet> {
        return;
    }

    public getAllDataSorted(event: Sort) {
        return this.allData;
    }
}