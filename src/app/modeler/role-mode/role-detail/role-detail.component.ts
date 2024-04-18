import { Component } from '@angular/core';
import {DataVariable, Role} from '@netgrif/petriflow';
import {ModelService} from '../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {RoleMasterDetailService} from '../role-master-detail.service';

@Component({
  selector: 'nab-role-detail',
  templateUrl: './role-detail.component.html',
  styleUrl: './role-detail.component.scss'
})
export class RoleDetailComponent {

    public constructor(
        private _masterService: RoleMasterDetailService,
        private _modelService: ModelService,
        private dialog: MatDialog
    ) {

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
    }

    changeTitle(role: Role, $event) {
        role.title.value = $event.target.value;
    }

    get item(): Role {
        return this.service.getSelected();
    }

    get service(): RoleMasterDetailService {
        return this._masterService;
    }
}
