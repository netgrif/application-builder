import {Component, Inject} from '@angular/core';
import {ChangedPetriNet} from './changed-petri-net';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {ModelService} from '../../modeler/services/model/model.service';
import {Router} from '@angular/router';
import {DialogManageRolesComponent, RoleRefType} from '../dialog-manage-roles/dialog-manage-roles.component';
import {DataType} from '@netgrif/petriflow';
import {FormControl, ValidatorFn, Validators} from '@angular/forms';

@Component({
    selector: 'nab-dialog-model-edit',
    templateUrl: './dialog-model-edit.component.html',
    styleUrls: ['./dialog-model-edit.component.scss']
})
export class DialogModelEditComponent {

    public model: ChangedPetriNet;
    public idCtrl: FormControl;
    public versionCtrl: FormControl;
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
        this.versionCtrl = new FormControl('', [
            // Validators.required,
            this.validVersion()
        ]);
        this.titleCtrl = new FormControl('', [Validators.required]);
        this.initialsCtrl = new FormControl('', [Validators.required]);
    }

    openPermissions() {
        this.dialog.open(DialogManageRolesComponent, {
            width: '60%',
            panelClass: "dialog-width-60",
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

    private validVersion(): ValidatorFn {
        return (fc: FormControl): { [key: string]: any } | null => {
            const version = fc.value as string;
            if (!version || version.length === 0) {
                return null;
            }
            if (version.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)) {
                return null;
            }
            return ({format: true})
        };
    }
}
