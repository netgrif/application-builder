import {Component, OnDestroy} from '@angular/core';
import {DataVariable, Role} from '@netgrif/petriflow';
import {ModelService} from '../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {RoleMasterDetailService} from '../role-master-detail.service';
import {Router} from '@angular/router';
import {ActionsModeService} from '../../actions-mode/actions-mode.service';
import {TransitionActionsTool} from '../../actions-mode/tools/transition-actions-tool';
import {ActionsMasterDetailService} from '../../actions-mode/actions-master-detail.setvice';
import {HistoryService} from '../../services/history/history.service';

export interface HistoryRoleSave {
    item: Role,
    save: boolean;
}


@Component({
  selector: 'nab-role-detail',
  templateUrl: './role-detail.component.html',
  styleUrl: './role-detail.component.scss'
})
export class RoleDetailComponent implements OnDestroy {

    historyRoleSave: HistoryRoleSave;

    public constructor(
        private _masterService: RoleMasterDetailService,
        private _modelService: ModelService,
        private _router: Router,
        private _actionMode: ActionsModeService,
        private _actionsMasterDetail: ActionsMasterDetailService,
        protected _historyService: HistoryService
    ) {
        this._masterService.getSelected$().subscribe(item => {
            if (this.historyRoleSave?.save) {
                this._historyService.save(`Role ${this.historyRoleSave.item.id} has been changed.`);
            }
            this.historyRoleSave = {
                item: item,
                save: false
            }
        });
    }

    ngOnDestroy() {
        if (this.historyRoleSave?.save) {
            this._historyService.save(`Role ${this.historyRoleSave.item.id} has been changed.`);
        }
    }

    changeId(role: Role, $event) {
        const oldId = role.id;
        this._modelService.model.removeRole(oldId);
        role.id = $event.target.value;
        this._modelService.model.addRole(role);
        const processRoleRef = this._modelService.model.getRoleRef(oldId);
        if (processRoleRef) {
            this._modelService.model.removeRoleRef(oldId);
            processRoleRef.id = $event.target.value;
            this._modelService.model.addRoleRef(processRoleRef);
        }
        this._modelService.model.getTransitions().forEach(trans => {
            const roleRef = trans.roleRefs.find(ref => ref.id === oldId);
            if (roleRef) {
                roleRef.id = role.id;
            }
        });
        this.historyRoleSave.save = true;
    }

    changeTitle(role: Role, $event) {
        role.title.value = $event.target.value;
        this.historyRoleSave.save = true;
    }

    get item(): Role {
        return this.service.getSelected();
    }

    get service(): RoleMasterDetailService {
        return this._masterService;
    }

    openActions() {
        this._actionMode.activate(this._actionMode.roleActionsTool);
        this._actionsMasterDetail.select(this._masterService.getSelected());
        this._router.navigate(['modeler/actions']);
    }
}
