import {Component, OnDestroy} from '@angular/core';
import {Role} from '@netgrif/petriflow';
import {ModelService} from '../../services/model/model.service';
import {RoleMasterDetailService} from '../role-master-detail.service';
import {Router} from '@angular/router';
import {ActionsModeService} from '../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../actions-mode/actions-master-detail.setvice';
import {HistoryService} from '../../services/history/history.service';
import {FormControl, ValidatorFn, Validators} from '@angular/forms';
import {ChangedRole} from './changed-role';
import {ModelerUtils} from '../../modeler-utils';

@Component({
    selector: 'nab-role-detail',
    templateUrl: './role-detail.component.html',
    styleUrl: './role-detail.component.scss'
})
export class RoleDetailComponent implements OnDestroy {

    public role: ChangedRole;
    public shouldSave: boolean = false;
    public form: FormControl;

    public constructor(
        private _masterService: RoleMasterDetailService,
        private _modelService: ModelService,
        private _router: Router,
        private _actionMode: ActionsModeService,
        private _actionsMasterDetail: ActionsMasterDetailService,
        protected _historyService: HistoryService
    ) {
        this._masterService.getSelected$().subscribe(item => {
            this.saveChange();
            if (item === undefined) {
                return;
            }
            this.role = new ChangedRole(item.clone());
        });
        this.form = new FormControl('', [
            Validators.required,
            this.validUnique()
        ]);
    }

    ngOnDestroy(): void {
        this.saveChange();
    }

    private saveChange(): void {
        if (!this.shouldSave) {
            return;
        }
        this._modelService.updateRole(this.role);
        this._historyService.save(`Role ${this.role.id} has been changed.`);
        this.shouldSave = false;
    }

    private validUnique(): ValidatorFn {
        return (fc: FormControl): { [key: string]: any } | null => {
            if (this._modelService.model.getRole(fc.value) !== undefined && fc.value !== this.item.id) {
                return ({validUnique: true});
            } else {
                return null;
            }
        };
    }

    changeId($event): void {
        this.role.role.id = $event.target.value;
        this.shouldSave = true;
    }

    changeTitle($event): void {
        this.role.role.title.value = $event.target.value;
        this.shouldSave = true;
    }

    get item(): Role {
        return this.service.getSelected();
    }

    get service(): RoleMasterDetailService {
        return this._masterService;
    }

    openActions(): void {
        this._actionMode.activate(this._actionMode.roleActionsTool);
        this._actionsMasterDetail.select(this.item);
        this._router.navigate(['modeler/actions']);
    }

    numberOfActions(): number {
        return ModelerUtils.numberOfEventActions(this.role.role.getEvents());
    }
}
