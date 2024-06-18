import {Component, Injector, OnInit} from '@angular/core';
import {PageMaster} from '../../components/master-detail/page-master';
import {ActionsModeService} from '../actions-mode.service';
import {Sort} from '@angular/material/sort';
import {DataActionsTool} from '../tools/data-actions-tool';
import {TransitionActionsTool} from '../tools/transition-actions-tool';
import {RoleActionsTool} from '../tools/role-actions-tool';
import {ComponentType} from '@angular/cdk/overlay';
import {ActionMasterItemComponent} from './action-master-item/action-master-item.component';
import {FunctionMasterItemComponent} from './function-master-item/function-master-item.component';
import {ActionsMasterDetailService} from '../actions-master-detail.setvice';

@Component({
  selector: 'nab-action-master',
  templateUrl: './action-master.component.html',
  styleUrl: './action-master.component.scss'
})
export class ActionMasterComponent extends PageMaster implements OnInit {

    constructor(private _parentInjector: Injector,
                private _actionsModeService: ActionsModeService,
                public masterService: ActionsMasterDetailService) {
        super();
    }

    ngOnInit(): void {
        super.ngOnInit();
        this._actionsModeService.activeToolSubject.subscribe(tool => {
            this.pageSize = 20;
            this.pageIndex = 0;
            this.updateData();
            this.sort.direction = '';
        });
    }

    get actionMasterItemComponent(): ComponentType<any> {
        return ActionMasterItemComponent;
    }

    get functionMasterItemComponent(): ComponentType<any> {
        return FunctionMasterItemComponent;
    }

    isFunctionsModeSelected(): boolean {
        return this._actionsModeService.activeTool.id === 'functions';
    }

    sortData(event: Sort): void {
        // TODO: check condition
        if (!event.active || event.direction === '') {
            if (this._actionsModeService.activeTool.id === DataActionsTool.ID ||
                this._actionsModeService.activeTool.id === TransitionActionsTool.ID ||
                this._actionsModeService.activeTool.id === RoleActionsTool.ID) {
                this.updateData();
            }
            return;
        }
        this._allData = this.masterService.getAllDataSorted(event);
        this.updatePage();
    }
}
