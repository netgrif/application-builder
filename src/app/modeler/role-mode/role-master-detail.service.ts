import {Injectable} from '@angular/core';
import {AbstractMasterDetailService} from '../components/master-detail/abstract-master-detail.service';
import {Role} from '@netgrif/petriflow';
import {ModelService} from '../services/model/model.service';
import {Sort} from '@angular/material/sort';
import {HistoryService} from '../services/history/history.service';

@Injectable({
    providedIn: 'root'
})
export class RoleMasterDetailService extends AbstractMasterDetailService<Role> {

    constructor(protected _modelService: ModelService,
                protected _historyService: HistoryService) {
        super();
    }

    public get allData(): Array<Role> {
        return this._modelService.model.getRoles();
    }

    public create(): Role {
        const role = this._modelService.newRole();
        this._create.next(role);
        this._historyService.save(`Role ${role.id} has been created.`)
        return role;
    }

    public delete(item: Role): void {
        this._modelService.removeRole(item);
        this._delete.next(item);
        this._historyService.save(`Role ${item.id} has been deleted.`)
    }

    public duplicate(item: Role): Role {
        const role = this._modelService.copyRole(item);
        this._create.next(role);
        this._historyService.save(`Role ${role.id} has been created.`)
        return role;
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
