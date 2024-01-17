import {Component, Inject, OnInit} from '@angular/core';
import {ChangedPetriNet} from './changed-petri-net';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {ModelService} from '../../modeler/services/model/model.service';
import {Router} from '@angular/router';
import {DialogManageRolesComponent, RoleRefType} from '../dialog-manage-roles/dialog-manage-roles.component';
import {DataType} from '@netgrif/petriflow';
import {FormControl, Validators} from '@angular/forms';

@Component({
    selector: 'nab-dialog-model-edit',
    templateUrl: './dialog-model-edit.component.html',
    styleUrls: ['./dialog-model-edit.component.scss']
})
export class DialogModelEditComponent {

    public model: ChangedPetriNet;
    public idCtrl: FormControl;
    public titleCtrl: FormControl;
    public initialsCtrl: FormControl;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ChangedPetriNet,
        public modelService: ModelService,
        private router: Router,
        private dialog: MatDialog
    ) {
        this.model = data;
        this.idCtrl = new FormControl('', [Validators.required]);
        this.titleCtrl = new FormControl('', [Validators.required]);
        this.initialsCtrl = new FormControl('', [Validators.required]);
    }

    openPermissions() {
        this.dialog.open(DialogManageRolesComponent, {
            width: '60%',
            data: {
                type: RoleRefType.PROCESS,
                roles: this.modelService.model.getRoles(),
                processRolesRefs: this.modelService.model.getRoleRefs(),
                processUserRefs: this.modelService.model.getUserRefs(),
                userLists: this.modelService.model.getDataSet().filter(item => item.type === DataType.USER_LIST)
            }
        });
    }

    openActions() {
        // TODO: NAB-327 open process view
        this.router.navigate(['modeler/actions']);
    }
}
