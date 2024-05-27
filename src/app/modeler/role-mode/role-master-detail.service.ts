import {Injectable} from '@angular/core';
import {AbstractMasterDetailService} from '../components/master-detail/abstract-master-detail.service';
import {DataType, DataVariable, Role} from '@netgrif/petriflow';
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
        const role = new Role(this._modelService.nextRoleId());
        this._modelService.model.addRole(role);
        this._create.next(role);
        this._historyService.save(`Role ${role.id} has been created.`)
        return role;
    }

    public delete(item: Role): void {
        // TODO: release/4.0.0 modelService.removeRole()
        this._modelService.model.removeRole(item.id);
        this._modelService.model.removeRoleRef(item.id);
        this._modelService.model.getTransitions().forEach(trans => {
            const index = trans.roleRefs.findIndex(roleRef => roleRef.id === item.id);
            if (index !== -1) {
                trans.roleRefs.splice(index, 1);
            }
        });
        this._delete.next(item);
        this._historyService.save(`Role ${item.id} has been deleted.`)
    }

    public duplicate(item: Role): Role {
        const role = item.clone();
        role.id = this._modelService.nextRoleId();
        this._modelService.model.addRole(role);
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
                case 'id':
                    return this.compare(a.id, b.id, isAsc);
            }
        });
    }

    protected compare(a: string, b: string, isAsc: boolean): number {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }
}
