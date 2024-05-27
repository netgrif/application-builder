import {Component, Injector, OnInit} from '@angular/core';
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
