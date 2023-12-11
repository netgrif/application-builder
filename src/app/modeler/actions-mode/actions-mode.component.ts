import {Component, ViewChild} from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {LeafNode, TreeNode} from './action-editor/classes/leaf-node';
import {ActionChangedEvent} from './action-editor/action-editor-list/action-editor-list.component';
import {ActionEditorTreeService} from './action-editor/action-editor-tree.service';
import {ActionsModeService} from './actions-mode.service';
import {
    DataVariable,
    FunctionScope,
    PetriflowFunction,
    PetriNet as PetriflowPetriNet,
    Role,
    Transition
} from '@netgrif/petriflow';
import {ActionEditorService} from './action-editor/action-editor.service';
import {ActionType, ChangeType} from './action-editor/classes/editable-action';
import {timer} from 'rxjs';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {MatSelectionListChange} from '@angular/material/list';
import {MasterItem} from './action-editor/classes/master-item';
import {SelectedTransitionService} from '../selected-transition.service';
import {actions} from './action-editor/classes/command-action';
import {DialogDeleteComponent} from '../../dialogs/dialog-delete/dialog-delete.component';
import {MatDialog} from '@angular/material/dialog';
import {DataActionsTool} from './data-actions-tool';
import {TransitionActionsTool} from './transition-actions-tool';
import {ProcessActionsTool} from './process-actions-tool';
import {RoleActionsTool} from './role-actions-tool';
import {FunctionsTool} from './functions-tool';
import {ModelService} from '../services/model/model.service';

export interface Scope {
    viewValue: string;
    value: FunctionScope;
}

@Component({
    selector: 'nab-actions-mode',
    templateUrl: './actions-mode.component.html',
    styleUrls: ['./actions-mode.component.scss']
})
export class ActionsModeComponent {
    // LIST
    dataSourceList: Array<DataVariable> | Array<Transition> | Array<MasterItem> | Array<Role> | Array<PetriflowFunction>;
    lengthList: number;
    pageSizeList: number;
    pageIndexList: number;
    pageSizeOptionsList: Array<number> = [10, 20, 50];
    dataArray: Array<DataVariable> | Array<Transition> | Array<MasterItem> | Array<Role> | Array<PetriflowFunction>;
    selected: Transition | DataVariable | MasterItem | Role | PetriflowFunction;
    drawerOpened: boolean;
    functionScopes: Array<Scope> = [
        {viewValue: 'Process', value: FunctionScope.PROCESS},
        {viewValue: 'Namespace', value: FunctionScope.NAMESPACE},
    ];

    @ViewChild(MatSort, {static: true}) sort: MatSort;

    // TREE
    public treeControl = new NestedTreeControl<TreeNode>(node => node.children);
    public dataSource = new MatTreeNestedDataSource<TreeNode>();

    constructor(
        private modelService: ModelService,
        private actionsModeService: ActionsModeService,
        private actionEditorService: ActionEditorService,
        private actionEditorTreeService: ActionEditorTreeService,
        private transitionService: SelectedTransitionService,
        private transitionActionsTool: TransitionActionsTool,
        private dialog: MatDialog
    ) {
        // MODEL
        setTimeout(() => {
            if (this.modelService.model === undefined) {
                this.modelService.model = new PetriflowPetriNet();
            }
            // DATA VARIABLES
            this.actionsModeService.activeToolSubject.subscribe(tool => {
                this.pageSizeList = 20;
                this.pageIndexList = 0;
                if (tool.id === DataActionsTool.ID) {
                    this.dataArray = this.modelService.model.getDataSet();
                    this.lengthList = this.dataArray.length;
                    this.dataSourceList = this.modelService.model.getDataSet().slice(0, this.pageSizeList);
                } else if (tool.id === TransitionActionsTool.ID) {
                    this.dataArray = this.modelService.model.getTransitions();
                    this.lengthList = this.dataArray.length;
                    const transitionIndex = this.dataArray.findIndex(t => t.id === transitionService.id);
                    this.pageIndexList = transitionIndex > 0 ? Math.floor(transitionIndex / this.pageSizeList) : 0;
                    this.dataSourceList = this.modelService.model.getTransitions().slice(this.pageIndexList * this.pageSizeList, (this.pageIndexList + 1) * this.pageSizeList);
                } else if (tool.id === ProcessActionsTool.ID) {
                    this.dataArray = this.createProcessAndCaseMasterItems();
                    this.lengthList = 2;
                    this.dataSourceList = this.dataArray;
                } else if (tool.id === RoleActionsTool.ID) {
                    this.dataArray = this.modelService.model.getRoles();
                    this.lengthList = this.dataArray.length;
                    this.dataSourceList = this.modelService.model.getRoles().slice(0, this.pageSizeList);
                } else if (tool.id === FunctionsTool.ID) {
                    this.dataArray = this.modelService.model.functions;
                    this.lengthList = this.dataArray.length;
                    this.dataSourceList = this.modelService.model.functions.slice(0, this.pageSizeList);
                }
                this.sort.direction = '';
            });

            timer().subscribe(_ => {
                const transitionId = this.transitionService.id;
                if (transitionId) {
                    this.actionsModeService.activate(transitionActionsTool);
                    timer(100).subscribe(__ => {
                        let foundTransition;
                        this.dataSourceList.forEach(item => {
                            if (item instanceof Transition && item.id === transitionId) {
                                foundTransition = item;
                            }
                        });
                        if (foundTransition) {
                            this.setData(foundTransition);
                        }
                    });
                    this.transitionService.id = undefined;
                }
            });
        });
    }

    get selectedFn(): PetriflowFunction {
        return this.selected as PetriflowFunction;
    }

    get selectedDt(): Transition | DataVariable | MasterItem | Role {
        return this.selected as Transition | DataVariable | MasterItem | Role;
    }

    // LIST
    onPageChanged(e) {
        this.pageIndexList = e.pageIndex;
        this.pageSizeList = e.pageSize;
        const firstCut = e.pageIndex * e.pageSize;
        const secondCut = firstCut + e.pageSize;
        if (this.actionsModeService.activeTool.id !== ProcessActionsTool.ID) {
            this.dataSourceList = this.dataArray.slice(firstCut, secondCut);
        }
    }

    setData(item: Transition | DataVariable | MasterItem | Role) {
        this.selected = item;
        if (item instanceof Transition) {
            const transition = this.modelService.model.getTransition(item.id);
            this.actionEditorService.populateEditedActionsFromTransition(transition);
            this.dataSource.data = this.actionEditorTreeService.createTransitionTreeStructure(this.actionEditorService.editedActions, (leaf: TreeNode, actionCount: number) => this.collapseParentCallback(leaf, actionCount));
        } else if (item instanceof DataVariable) {
            const dataVar = this.modelService.model.getData(item.id);
            this.actionEditorService.populateEditedActionsFromDataVariable(dataVar);
            const hiddenParent = {
                type: ActionType.DATA,
                actionCount: undefined, // attribute is required but the hiddenParent doesn't use it
                children: this.actionEditorTreeService.createDatafieldTreeStructure(this.actionEditorService.editedActions[0].editableActions, (leaf: TreeNode, actionCount: number) => this.collapseParentCallback(leaf, actionCount))
            };
            hiddenParent.children.forEach(child => {
                child.parent = hiddenParent;
            });
            this.dataSource.data = hiddenParent.children;
        } else if (item instanceof MasterItem) {
            if (item.type === ActionType.CASE) {
                this.actionEditorService.populateEditedActionsFromCaseEvents(item);
            } else {
                this.actionEditorService.populateEditedActionsFromProcessEvents(item);
            }
            const hiddenParent = {
                type: item.type,
                actionCount: undefined,
                children: this.actionEditorTreeService.createCaseTreeStructure(this.actionEditorService.editedActions[0].editableActions, item.type, (leaf: TreeNode, actionCount: number) => this.collapseParentCallback(leaf, actionCount))
            };
            hiddenParent.children.forEach(child => {
                child.parent = hiddenParent;
            });
            this.dataSource.data = hiddenParent.children;
        } else if (item instanceof Role) {
            const role = this.modelService.model.getRole(item.id);
            this.actionEditorService.populateEditedActionsFromRole(role);
            this.dataSource.data = this.actionEditorTreeService.createRoleTreeStructure(this.actionEditorService.editedActions[0].editableActions, (leaf: TreeNode, actionCount: number) => this.collapseParentCallback(leaf, actionCount));
        }
    }

    // TREE

    newAction(node: TreeNode): void {
        const newAction = (node.children[0] as LeafNode).addAction(node.type, node.event, node.phase);
        this.treeControl.expand(node);

        newAction.changeType = ChangeType.CREATED;
        this.actionEditorService.saveActionChange(newAction);
    }

    actionChangedListener(changeEvent: ActionChangedEvent, emittingNode: TreeNode): void {
        if (changeEvent.action.changeType === ChangeType.MOVED) {
            this.moveNodeInTree(changeEvent, emittingNode);
        }

        this.actionEditorService.saveActionChange(changeEvent.action);
    }

    moveNodeInTree(changeEvent: ActionChangedEvent, emittingNode: TreeNode): void {
        let node = emittingNode;
        // emitting node is the leaf node and thus we need to traverse up one extra node to reach the desired ancestor node
        for (let i = 0; i < changeEvent.triggerPath.length + 1; i++) {
            node = node.parent;
        }
        for (const key of changeEvent.triggerPath) {
            node = node.children.find(it => it.id === key);
        }
        // same as above, we need to dive one node deeper to reach our desired leaf
        node = node.children[0];

        if (node instanceof LeafNode) {
            node.pushAction(changeEvent.action);
        }
    }

    isInnerNode(_: number, node: TreeNode): boolean {
        return !!node.children && node.children.length > 0 && !node.canAdd;
    }

    isAddNode(_: number, node: TreeNode): boolean {
        return !!node.canAdd;
    }

    isLeafNode(_: number, node: TreeNode): boolean {
        return node instanceof LeafNode;
    }

    actionsExpandable(parentNode: TreeNode): boolean {
        const child = parentNode.children[0];
        return child instanceof LeafNode && child.hasDisplayableActions();
    }

    collapseParentCallback(leaf: TreeNode, actionCount: number) {
        if (actionCount === 0) {
            this.treeControl.collapse(leaf.parent);
        }
    }

    sortData(sort: Sort) {
        const firstCut = this.pageIndexList * this.pageSizeList;
        const secondCut = firstCut + this.pageSizeList;

        if (!sort.active || sort.direction === '') {
            if (this.actionsModeService.activeTool.id === DataActionsTool.ID) {
                this.dataArray = this.modelService.model.getDataSet();
                this.dataSourceList = this.dataArray.slice(firstCut, secondCut);
            } else if (this.actionsModeService.activeTool.id === TransitionActionsTool.ID) {
                this.dataArray = this.modelService.model.getTransitions();
                this.dataSourceList = this.dataArray.slice(firstCut, secondCut);
            } else if (this.actionsModeService.activeTool.id === RoleActionsTool.ID) {
                this.dataArray = this.modelService.model.getRoles();
                this.dataSourceList = this.dataArray.slice(firstCut, secondCut);
            }
            return;
        }

        this.dataArray.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'id':
                    return this.compareId(a.id, b.id, isAsc);
                case 'name':
                    if (a instanceof Transition) {
                        return this.compare(a.label?.value, b.label?.value, isAsc);
                    } else if (a instanceof DataVariable || a instanceof Role) {
                        return this.compare(a.title?.value, b.title?.value, isAsc);
                    }
            }
        });
        this.dataSourceList = this.dataArray.slice(firstCut, secondCut);
    }

    selectionChanged(listChange: MatSelectionListChange) {
        listChange.source.selectedOptions.selected
            .filter(option => option.value.id !== listChange.options[0].value.id)
            .forEach(option => option.selected = false);
    }

    compareId(a: number | string, b: number | string, isAsc: boolean) {
        const parseda = parseInt(String(a), 10);
        const parsedb = parseInt(String(b), 10);
        if (isNaN(parseda) || isNaN(parsedb)) {
            return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
        } else {
            return (parseda < parsedb ? -1 : 1) * (isAsc ? 1 : -1);
        }
    }

    compare(a: number | string, b: number | string, isAsc: boolean) {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    checkDrawer($event) {
        this.drawerOpened = $event;
    }

    getItemTitle(item: DataVariable | Transition): string {
        return (item instanceof Transition ? item.label : item.title)?.value ?? '';
    }

    private createProcessAndCaseMasterItems(): Array<MasterItem> {
        return [
            new MasterItem('Process', ActionType.PROCESS, this.modelService.model),
            new MasterItem('Case', ActionType.CASE, this.modelService.model)
        ];
    }

    isFunctionsModeSelected(): boolean {
        return this.actionsModeService.activeTool.id === 'functions';
    }

    isFunctionSelected(): boolean {
        return this.selected instanceof PetriflowFunction;
    }

    addFunction() {
        const fn = new PetriflowFunction('new_function', FunctionScope.PROCESS, '{ -> \n}');
        this.modelService.model.functions.push(fn);
        this.updateData();
        this.selected = fn;
    }

    updateFunctions() {
        actions[actions.length - 1].actions = this.modelService.model.functions.map(fn => {
            return {
                label: fn.name,
                action: `${fn.name}()`,
            };
        });
    }

    openDialog(event, item: PetriflowFunction): void {
        event.stopPropagation();
        const dialogRef = this.dialog.open(DialogDeleteComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.modelService.model.functions.splice(this.modelService.model.functions.indexOf(item), 1);
                this.updateData();
                this.selected = undefined;
            }
        });
    }

    updateData() {
        this.dataArray = this.modelService.model.functions;
        this.lengthList = this.dataArray.length;
        this.pageIndexList = Math.ceil(this.dataArray.length / this.pageSizeList) - 1;
        const firstCut = this.pageIndexList * this.pageSizeList;
        const secondCut = firstCut + this.pageSizeList;
        this.dataSourceList = this.dataArray.slice(firstCut, secondCut);
    }

    showIcons(event) {
        event.target.querySelectorAll('.function-icon').forEach(node => {
            node.classList.remove('function-list-icon-hidden');
        });
    }

    hideIcons(event) {
        event.target.querySelectorAll('.function-icon').forEach(node => {
            node.classList.add('function-list-icon-hidden');
        });
    }
}
