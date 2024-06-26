import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSort, MatSortable, Sort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {DataVariable, ProcessRoleRef, ProcessUserRef, Role, RoleRef, UserRef} from '@netgrif/petriflow';
import {ModelService} from '../../modeler/services/model/model.service';
import {ModelerConfig} from '../../modeler/modeler-config';
import {HistoryService} from '../../modeler/services/history/history.service';

export enum RoleRefType {
    TRANSITION = 'transition',
    PROCESS = 'process'
}

export interface ManagePermissionData {
    type: RoleRefType;
    roles: Array<Role>;
    userLists: Array<DataVariable>;
    rolesRefs?: Array<RoleRef>;
    processRolesRefs?: Array<ProcessRoleRef>;
    userRefs?: Array<UserRef>;
    processUserRefs?: Array<ProcessUserRef>;
}

@Component({
    selector: 'nab-dialog.manage-roles',
    templateUrl: './dialog-manage-roles.component.html',
    styleUrls: ['./dialog-manage-roles.component.scss']
})
export class DialogManageRolesComponent implements OnInit, OnDestroy {
    pageSizes = [5, 10, 20];
    defaultPageSize = 10;
    displayedColumns: Array<string>;
    usersDisplayedColumns: Array<string>;
    dataSource: MatTableDataSource<RoleRef | ProcessRoleRef>;
    usersDataSource: MatTableDataSource<UserRef | ProcessUserRef>;
    @ViewChild('matPaginator', {static: true}) paginator: MatPaginator;
    @ViewChild('matUserPaginator', {static: true}) userPaginator: MatPaginator;
    @ViewChild('firstTableSort', {static: true}) sort: MatSort;
    @ViewChild('secondTableSort', {static: true}) userSort: MatSort;
    private historyChange: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ManagePermissionData,
        private modelService: ModelService,
        private historyService: HistoryService
    ) {
        let arrayRoleRefs: Array<RoleRef> | Array<ProcessRoleRef>;
        let arrayUserRefs: Array<UserRef> | Array<ProcessUserRef>;
        if (this.data.type === RoleRefType.TRANSITION) {
            arrayRoleRefs = [...this.data.rolesRefs];
            this.addDefaultRoleRefs(arrayRoleRefs);
            arrayUserRefs = [...this.data.userRefs];
            this.displayedColumns = ['id', 'perform', 'delegate', 'cancel', 'assign', 'view'];
            this.usersDisplayedColumns = ['id', 'perform', 'delegate', 'cancel', 'assign', 'view'];
            this.data.roles.forEach(item => {
                if (this.data.rolesRefs.find(itm => itm.id === item.id) === undefined) {
                    (arrayRoleRefs as Array<RoleRef>).push(new RoleRef(item.id));
                }
            });
            this.data.userLists.forEach(item => {
                if (this.data.userRefs.find(itm => itm.id === item.id) === undefined) {
                    (arrayUserRefs as Array<UserRef>).push(new UserRef(item.id));
                }
            });
            this.dataSource = new MatTableDataSource<RoleRef>(arrayRoleRefs);
            this.usersDataSource = new MatTableDataSource<UserRef>(arrayUserRefs);
        } else {
            arrayRoleRefs = [...this.data.processRolesRefs];
            this.addDefaultProcessRoleRefs(arrayRoleRefs);
            arrayUserRefs = [...this.data.processUserRefs];
            this.displayedColumns = ['id', 'create', 'delete', 'processView'];
            this.usersDisplayedColumns = ['id', 'create', 'delete', 'processView'];
            this.data.roles.forEach(item => {
                if (this.data.processRolesRefs.find(itm => itm.id === item.id) === undefined) {
                    (arrayRoleRefs as Array<ProcessRoleRef>).push(new ProcessRoleRef(item.id));
                }
            });
            this.data.userLists.forEach(item => {
                if (this.data.processUserRefs.find(itm => itm.id === item.id) === undefined) {
                    (arrayUserRefs as Array<ProcessUserRef>).push(new ProcessUserRef(item.id));
                }
            });
            this.dataSource = new MatTableDataSource<ProcessRoleRef>(arrayRoleRefs);
            this.usersDataSource = new MatTableDataSource<ProcessUserRef>(arrayUserRefs);
        }
        this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
                case 'perform':
                    return (item as RoleRef).logic.perform?.toString();
                case 'delegate':
                    return (item as RoleRef).logic.delegate?.toString();
                case 'cancel':
                    return (item as RoleRef).logic.cancel?.toString();
                case 'assign':
                    return (item as RoleRef).logic.assign?.toString();
                case 'create':
                    return (item as ProcessRoleRef).caseLogic.create?.toString();
                case 'delete':
                    return (item as ProcessRoleRef).caseLogic.delete?.toString();
                case 'view':
                    return (item as RoleRef).logic.view?.toString();
                case 'processView':
                    return (item as ProcessRoleRef).caseLogic.view?.toString();
                default:
                    return item[property];
            }
        };
    }

    ngOnInit() {
        this.dataSource.paginator = this.paginator;
        this.usersDataSource.paginator = this.userPaginator;
        this.dataSource.sort = this.sort;
        this.usersDataSource.sort = this.userSort;
        this.sort.sort(({
            id: localStorage.getItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.ROLE_SORT),
            start: localStorage.getItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.ROLE_DIRECTION)
        }) as MatSortable);
        this.userSort.sort(({
            id: localStorage.getItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.USER_REF_SORT),
            start: localStorage.getItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.USER_REF_DIRECTION)
        }) as MatSortable);
    }

    setValue($event, id: string, change: string) {
        if (this.data.type === RoleRefType.TRANSITION) {
            this.setRoleRef(this.data.rolesRefs.find(item => item.id === id), id, change);
        } else {
            this.setProcessRoleRef(this.data.processRolesRefs.find(item => item.id === id), id, change);
        }
        this.historyChange = true;
    }

    setUserValue($event, id: string, change: string) {
        if (this.data.type === RoleRefType.TRANSITION) {
            this.setUserRef(this.data.userRefs.find(item => item.id === id), id, change);
        } else {
            this.setProcessUserRef(this.data.processUserRefs.find(item => item.id === id), id, change);
        }
        this.historyChange = true;
    }

    private setRoleRef(roleRef: RoleRef, id: string, change: string) {
        if (roleRef === undefined) {
            this.data.rolesRefs.push(new RoleRef(id));
            this.data.rolesRefs.find(item => item.id === id).logic[change] = true;
            (this.dataSource.data.find(item => item.id === id) as RoleRef).logic[change] = true;
        } else {
            const newValue = this.resolveNewValue(roleRef, change);
            this.data.rolesRefs.find(item => item.id === id).logic[change] = newValue;
            (this.dataSource.data.find(item => item.id === id) as RoleRef).logic[change] = newValue;
        }
    }

    private setProcessRoleRef(processRoleRef: ProcessRoleRef, id: string, change: string) {
        if (processRoleRef === undefined) {
            const roleRef = new ProcessRoleRef(id);
            this.data.processRolesRefs.push(roleRef);
            this.modelService.model.addRoleRef(roleRef);
            this.data.processRolesRefs.find(item => item.id === id).caseLogic[change] = true;
            (this.dataSource.data.find(item => item.id === id) as ProcessRoleRef).caseLogic[change] = true;
        } else {
            const newValue = this.resolveNewProcessValue(processRoleRef, change);
            this.data.processRolesRefs.find(item => item.id === id).caseLogic[change] = newValue;
            (this.dataSource.data.find(item => item.id === id) as ProcessRoleRef).caseLogic[change] = newValue;
        }
    }

    private setUserRef(userRef: UserRef, id: string, change: string) {
        if (userRef === undefined) {
            this.data.userRefs.push(new UserRef(id));
            this.data.userRefs.find(item => item.id === id).logic[change] = true;
            (this.usersDataSource.data.find(item => item.id === id) as UserRef).logic[change] = true;
        } else {
            const newValue = this.resolveNewValue(userRef, change);
            this.data.userRefs.find(item => item.id === id).logic[change] = newValue;
            (this.usersDataSource.data.find(item => item.id === id) as UserRef).logic[change] = newValue;
        }
    }

    private setProcessUserRef(processUserRef: ProcessUserRef, id: string, change: string) {
        if (processUserRef === undefined) {
            const ref = new ProcessUserRef(id);
            this.data.processUserRefs.push(ref);
            this.modelService.model.addUserRef(ref);
            this.data.processUserRefs.find(item => item.id === id).caseLogic[change] = true;
            (this.usersDataSource.data.find(item => item.id === id) as ProcessUserRef).caseLogic[change] = true;
        } else {
            const newValue = this.resolveNewProcessValue(processUserRef, change);
            this.data.processUserRefs.find(item => item.id === id).caseLogic[change] = newValue;
            (this.usersDataSource.data.find(item => item.id === id) as ProcessUserRef).caseLogic[change] = newValue;
        }
    }

    protected resolveNewValue(roleRef, change) {
        let newValue;
        if (roleRef.logic[change] === undefined) {
            newValue = true;
        } else if (roleRef.logic[change] === true) {
            newValue = false;
        }
        return newValue;
    }

    protected resolveNewProcessValue(roleRef, change) {
        let newValue;
        if (roleRef.caseLogic[change] === undefined) {
            newValue = true;
        } else if (roleRef.caseLogic[change] === true) {
            newValue = false;
        }
        return newValue;
    }

    stringValue(logic: boolean) {
        if (logic === undefined) {
            return ' ';
        } else if (logic === true) {
            return 'True';
        } else {
            return 'False';
        }
    }

    getChecked(logic: boolean) {
        if (logic === undefined) {
            return false;
        } else if (logic === true) {
            return true;
        }
        return undefined;
    }

    getIndeterminate(logic: boolean) {
        return !(logic === undefined || logic === true);
    }

    private addDefaultRoleRefs(arrayRoleRefs: Array<RoleRef>) {
        if (!arrayRoleRefs.find(roleRef => roleRef.id === Role.DEFAULT)) {
            arrayRoleRefs.push(new RoleRef(Role.DEFAULT));
        }
        if (!arrayRoleRefs.find(roleRef => roleRef.id === Role.ANONYMOUS)) {
            arrayRoleRefs.push(new RoleRef(Role.ANONYMOUS));
        }
    }

    private addDefaultProcessRoleRefs(arrayRoleRefs: Array<ProcessRoleRef>) {
        if (!arrayRoleRefs.find(roleRef => roleRef.id === Role.DEFAULT)) {
            arrayRoleRefs.push(new ProcessRoleRef(Role.DEFAULT));
        }
        if (!arrayRoleRefs.find(roleRef => roleRef.id === Role.ANONYMOUS)) {
            arrayRoleRefs.push(new ProcessRoleRef(Role.ANONYMOUS));
        }
    }

    sortRoleRefs(sort: Sort): void {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.ROLE_SORT, sort.active);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.ROLE_DIRECTION, sort.direction);
    }

    sortUserRefs(sort: Sort): void {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.USER_REF_SORT, sort.active);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.PERMISSION_DIALOG.USER_REF_DIRECTION, sort.direction);
    }

    ngOnDestroy(): void {
        if (this.historyChange) {
            this.historyService.save("Role assignments has been changed.");
        }
    }
}
