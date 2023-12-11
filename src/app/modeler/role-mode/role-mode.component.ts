import {AfterViewInit, Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Sort} from '@angular/material/sort';
import {Role} from '@netgrif/petriflow';
import {DialogDeleteComponent} from '../../dialogs/dialog-delete/dialog-delete.component';
import {ModelService} from '../services/model.service';
import {RoleModeService} from './role-mode.service';

@Component({
  selector: 'nab-role-mode',
  templateUrl: './role-mode.component.html',
  styleUrls: ['./role-mode.component.scss'],
})
export class RoleModeComponent implements AfterViewInit, OnInit {
  dataSource: Array<Role>;
  length: number;
  pageSize: number;
  pageIndex: number;
  pageSizeOptions: Array<number> = [5, 10, 20];
  show: boolean;
  counter = 0;

  constructor(private modelService: ModelService, private roleService: RoleModeService, private deleteDialog: MatDialog) {
  }

  get roles(): Array<Role> {
    return this.modelService.model.getRoles();
  }

  ngOnInit() {
    this.pageSize = 10;
    this.pageIndex = 0;
    this.length = this.roles.length;
    this.dataSource = [...this.roles.slice(0, this.pageSize)];
    this.counter = 0;
    if (this.show === undefined) {
      this.show = false;
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.show = true;
    });
  }

  onPageChanged(e) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    const firstCut = e.pageIndex * e.pageSize;
    const secondCut = firstCut + e.pageSize;
    this.dataSource = this.roles.slice(firstCut, secondCut);
  }

  onCRUDChange() {
    const firstCut = this.pageIndex * this.pageSize;
    const secondCut = firstCut + this.pageSize;
    this.dataSource = this.roles.slice(firstCut, secondCut);
  }

  addRole() {
    const role = new Role(this.createId());
    this.modelService.model.addRole(role);
    this.length = this.modelService.model.getRoles().length;
    this.pageIndex = Math.ceil(this.length / this.pageSize) - 1;
    this.onCRUDChange();
  }

  changeId(role: Role, $event) {
    const oldId = role.id;
    this.modelService.model.removeRole(oldId);
    role.id = $event.target.value;
    this.modelService.model.addRole(role);
    const processRoleRef = this.modelService.model.getRoleRef(oldId);
    if (processRoleRef) {
      this.modelService.model.removeRoleRef(oldId);
      processRoleRef.id = $event.target.value;
      this.modelService.model.addRoleRef(processRoleRef);
    }
    this.modelService.model.getTransitions().forEach(trans => {
      const roleRef = trans.roleRefs.find(ref => ref.id === oldId);
      if (roleRef) {
        roleRef.id = role.id;
      }
    });
  }

  changeTitle(role: Role, $event) {
    role.title.value = $event.target.value;
  }

  removeRole(item: Role) {
    this.modelService.model.removeRole(item.id);
    this.modelService.model.getTransitions().forEach(trans => {
      const index = trans.roleRefs.findIndex(roleRef => roleRef.id === item.id);
      if (index !== -1) {
        trans.roleRefs.splice(index, 1);
      }
    });
    this.roles.splice(this.roles.indexOf(item), 1);
    this.dataSource.splice(this.dataSource.indexOf(item), 1);
    this.length = this.roles.length;
    this.onCRUDChange();
  }

  sortData(sort: Sort) {
    const firstCut = this.pageIndex * this.pageSize;
    const secondCut = firstCut + this.pageSize;
    if (!sort.active || sort.direction === '') {
      this.dataSource = this.roles.slice(firstCut, secondCut);
      return;
    }

    this.roles.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'title':
          return this.compare(a.title.value, b.title.value, isAsc);
        case 'id':
          return this.compare(a.id, b.id, isAsc);
      }
    });
    this.dataSource = this.roles.slice(firstCut, secondCut);
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  openDialog(item: Role): void {
    const dialogRef = this.deleteDialog.open(DialogDeleteComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.removeRole(item);
      }
    });
  }

  private createId() {
    this.counter++;
    if (this.modelService.model.getRole('newRole_' + this.counter)) {
      return this.createId();
    } else {
      return 'newRole_' + String(this.counter);
    }
  }
}
