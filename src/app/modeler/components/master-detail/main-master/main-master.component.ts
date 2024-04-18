import {Component, Injector, Input, OnInit, ViewChild} from '@angular/core';
import {MatSort, Sort} from '@angular/material/sort';
import {DataVariable} from '@netgrif/petriflow';
import {PageEvent} from '@angular/material/paginator';
import {AbstractMasterDetailService} from '../abstract-master-detail.service';
import {ComponentType} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {PageMaster} from '../page-master';

@Component({
    selector: 'nab-main-master',
    templateUrl: './main-master.component.html',
    styleUrl: './main-master.component.scss'
})
export class MainMasterComponent extends PageMaster implements OnInit {

    constructor(private _parentInjector: Injector) {
        super();
    }

    ngOnInit(): void {
        this.pageSize = 20;
        this.pageIndex = 0;
        this._allData = this.masterService.allData;
        this.updatePage();

        this.masterService.getCreateEvent$().subscribe(newItem => {
            this.updateData();
            this.masterService.select(newItem);
        });
        this.masterService.getDeleteEvent$().subscribe(() => {
            this.updateData();
            this.masterService.select(undefined);
        });
    }

}
