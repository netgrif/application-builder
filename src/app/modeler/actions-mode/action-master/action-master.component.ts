import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {PageMasterComponent} from '../../components/master-detail/page-master.component';
import {ActionsModeService} from '../actions-mode.service';
import {Sort} from '@angular/material/sort';
import {ComponentType} from '@angular/cdk/overlay';
import {ActionMasterItemComponent} from './action-master-item/action-master-item.component';
import {FunctionMasterItemComponent} from './function-master-item/function-master-item.component';
import {ActionsMasterDetailService} from '../actions-master-detail.setvice';
import {FunctionsTool} from '../tools/functions-tool';
import {ProcessActionsTool} from '../tools/process-actions-tool';
import {skip} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'nab-action-master',
  templateUrl: './action-master.component.html',
  styleUrl: './action-master.component.scss'
})
export class ActionMasterComponent extends PageMasterComponent implements OnInit {

    private readonly _actionDestroyRef = inject(DestroyRef);

    constructor(private _actionsModeService: ActionsModeService,
                public masterService: ActionsMasterDetailService) {
        super();
    }

    ngOnInit(): void {
        super.ngOnInit();
        this._actionsModeService.activeToolSubject.pipe(
            skip(1),
            takeUntilDestroyed(this._actionDestroyRef)
        ).subscribe(() => {
            this.pageSize = 20;
            this.refreshForCurrentModel();
        });
    }

    get actionMasterItemComponent(): ComponentType<any> {
        return ActionMasterItemComponent;
    }

    get functionMasterItemComponent(): ComponentType<any> {
        return FunctionMasterItemComponent;
    }

    isFunctionsModeSelected(): boolean {
        return this._actionsModeService.activeTool.id === FunctionsTool.ID;
    }

    isProcessAndCase(): boolean {
        return this._actionsModeService.activeTool.id === ProcessActionsTool.ID;
    }

    sortData(event: Sort): void {
        // TODO: check condition
        if (!event.active || event.direction === '') {
            if (this._actionsModeService.activeTool.id === 'data' ||
                this._actionsModeService.activeTool.id === 'transition' ||
                this._actionsModeService.activeTool.id === 'role') {
                event.active = 'id';
                event.direction = 'asc';
                this.pageIndex = 0;
            } else {
                return;
            }
        }
        this.masterService.setSortToLocalStorage(event);
        this._allData = this.masterService.getAllDataSorted(event);
        this.updatePage();
    }
}
