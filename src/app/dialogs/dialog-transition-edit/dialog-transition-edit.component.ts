import {Component, Inject, OnInit} from '@angular/core';
import {AssignPolicy, DataType, FinishPolicy} from '@netgrif/petriflow';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {ModelService} from '../../modeler/services/model/model.service';
import {ChangedTransition} from './changed-transition';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../modeler/selected-transition.service';
import {FormControl, ValidatorFn, Validators} from '@angular/forms';
import {DialogManageRolesComponent, RoleRefType} from '../dialog-manage-roles/dialog-manage-roles.component';

export interface TransitionEditData {
    transitionId: string;
}

@Component({
    selector: 'nab-dialog-transition-edit',
    templateUrl: './dialog-transition-edit.component.html',
    styleUrls: ['./dialog-transition-edit.component.scss']
})
export class DialogTransitionEditComponent implements OnInit {

    public transition: ChangedTransition;
    public assignPolicies: Array<AssignPolicy>;
    public finishPolicies: Array<FinishPolicy>;
    public form: FormControl;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: TransitionEditData,
        public modelService: ModelService,
        private router: Router,
        private transitionService: SelectedTransitionService,
        private dialog: MatDialog
    ) {
        this.transition = new ChangedTransition(undefined, this.modelService.model.getTransition(data.transitionId).clone());
        this.form = new FormControl('', [
            Validators.required,
            this.validUnique()
        ]);
    }

    ngOnInit(): void {
        this.assignPolicies = Object.values(AssignPolicy);
        this.finishPolicies = Object.values(FinishPolicy);
    }

    openFormBuilder() {
        // TODO: NAB-326 refactor SelectedTransitionService
        this.transitionService.id = this.transition.id;
        this.router.navigate(['/form']);
    }

    openActions() {
        this.transitionService.id = this.transition.id;
        this.router.navigate(['modeler/actions']);
    }

    private validUnique(): ValidatorFn {
        return (fc: FormControl): { [key: string]: any } | null => {
            if (this.modelService.model.getTransition(fc.value) !== undefined && fc.value !== this.transition.id) {
                return ({validUnique: true});
            } else {
                return null;
            }
        };
    }

    openPermissions() {
        this.dialog.open(DialogManageRolesComponent, {
            width: '60%',
            panelClass: "dialog-width-60",
            data: {
                type: RoleRefType.TRANSITION,
                roles: this.modelService.model.getRoles(),
                rolesRefs: this.transition.transition.roleRefs,
                userRefs: this.transition.transition.userRefs,
                userLists: this.modelService.model.getDataSet().filter(item => item.type === DataType.USER_LIST)
            }
        });
    }
}
