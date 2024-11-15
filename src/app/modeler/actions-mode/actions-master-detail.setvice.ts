import {Injectable} from '@angular/core';
import {AbstractMasterDetailService} from '../components/master-detail/abstract-master-detail.service';
import {DataVariable,
    FunctionScope,
    PetriflowFunction,
    Role,
    Transition} from '@netgrif/petriflow';
import {ModelService} from '../services/model/model.service';
import {Sort} from '@angular/material/sort';
import {MasterItem} from './action-editor/classes/master-item';
import {ActionsModeService} from './actions-mode.service';
import {DataActionsTool} from './tools/data-actions-tool';
import {TransitionActionsTool} from './tools/transition-actions-tool';
import {ActionType} from './action-editor/classes/editable-action';
import {ProcessActionsTool} from './tools/process-actions-tool';
import {RoleActionsTool} from './tools/role-actions-tool';
import {FunctionsTool} from './tools/functions-tool';
import {ModelerConfig} from '../modeler-config';

@Injectable({
    providedIn: 'root'
})
export class ActionsMasterDetailService extends AbstractMasterDetailService<Transition | DataVariable | MasterItem | Role | PetriflowFunction> {

    constructor(protected _modelService: ModelService,
                protected _actionsModeService: ActionsModeService) {
        super();
    }

    public get allData(): Array<Transition | DataVariable | MasterItem | Role | PetriflowFunction> {
        // TODO: release/4.0.0 refactor
        if (this._actionsModeService.activeTool.id === DataActionsTool.ID) {
            return this._modelService.model.getDataSet();
        } else if (this._actionsModeService.activeTool.id === TransitionActionsTool.ID) {
            return this._modelService.model.getTransitions();
        } else if (this._actionsModeService.activeTool.id === ProcessActionsTool.ID) {
            return this.createProcessAndCaseMasterItems();
        } else if (this._actionsModeService.activeTool.id === RoleActionsTool.ID) {
            return this._modelService.model.getRoles();
        } else if (this._actionsModeService.activeTool.id === FunctionsTool.ID) {
            return this._modelService.model.functions;
        }
        return [];
    }

    public create(): PetriflowFunction {
        const fn = new PetriflowFunction('new_function', FunctionScope.PROCESS, '{ -> \n}');
        this._modelService.model.functions.push(fn);
        this._create.next(fn);
        return fn;
    }

    public delete(item: PetriflowFunction): void {
        this._modelService.model.functions.splice(this._modelService.model.functions.indexOf(item), 1);
        this._delete.next(item);
    }

    public duplicate(item: PetriflowFunction): PetriflowFunction {
        throw new Error("Unsupported operation")
    }

    public getAllDataSorted(event: Sort) {
        return this.allData.toSorted((a: any, b: any) => {
            const isAsc = event.direction === 'asc';
            switch (event.active) {
                case 'name':
                    if (a instanceof Transition) {
                        return this.compare(a.label?.value, b.label?.value, isAsc);
                    } else if (a instanceof DataVariable || a instanceof Role) {
                        return this.compare(a.title?.value, b.title?.value, isAsc);
                    }
                    break;
                default:
                    return this.compare(a.id, b.id, isAsc);
            }
        });
    }

    private createProcessAndCaseMasterItems(): Array<MasterItem> {
        return [
            new MasterItem('Process', ActionType.PROCESS, this._modelService.model),
            new MasterItem('Case', ActionType.CASE, this._modelService.model)
        ];
    }

    getSortFromLocalStorage(): Sort {
        if (this._actionsModeService.activeTool.id === DataActionsTool.ID &&
            localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.DATA_ACTION_SORT) !== null) {
            return {active: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.DATA_ACTION_SORT),
                direction: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.DATA_ACTION_DIRECTION)} as Sort;
        } else if (this._actionsModeService.activeTool.id === RoleActionsTool.ID &&
            localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.ROLE_ACTION_SORT) !== null) {
            return {active: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.ROLE_ACTION_SORT),
                direction: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.ROLE_ACTION_DIRECTION)} as Sort;
        } else if (this._actionsModeService.activeTool.id === TransitionActionsTool.ID &&
            localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.TRANS_ACTION_SORT) !== null) {
            return {active: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.TRANS_ACTION_SORT),
                direction: localStorage.getItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.TRANS_ACTION_DIRECTION)} as Sort;
        } else {
            return {active: 'id', direction: 'asc'}
        }
    }

    setSortToLocalStorage(sort: Sort) {
        if (this._actionsModeService.activeTool.id === DataActionsTool.ID) {
            localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.DATA_ACTION_SORT, sort.active);
            localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.DATA_ACTION_DIRECTION, sort.direction);
        } else if (this._actionsModeService.activeTool.id === RoleActionsTool.ID) {
            localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.ROLE_ACTION_SORT, sort.active);
            localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.ROLE_ACTION_DIRECTION, sort.direction);
        } else if (this._actionsModeService.activeTool.id === TransitionActionsTool.ID) {
            localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.TRANS_ACTION_SORT, sort.active);
            localStorage.setItem(ModelerConfig.LOCALSTORAGE.MASTER_DETAIL.TRANS_ACTION_DIRECTION, sort.direction);
        }
    }
}
