import {AbstractMasterComponent} from './abstract-master.component';
import {ViewChild} from '@angular/core';
import {MatSort, SortDirection} from '@angular/material/sort';
import {MasterDetailService} from './master-detail.service';
import {PageEvent} from '@angular/material/paginator';

export abstract class PageMaster<T> extends AbstractMasterComponent<T> {
    private _pageSize: number;
    private _pageIndex: number;
    @ViewChild(MatSort, {static: true}) sort: MatSort;

    protected constructor(
        protected _service: MasterDetailService<T>,
        pageSize: number = 20,
        defaultSort: SortDirection = ''
    ) {
        super(_service);
        this.pageSize = pageSize;
        this.pageIndex = 0;
        this.sort.direction = defaultSort;
    }

    removeItem(item: T): void {
        super.removeItem(item);
        this.updatePageData();
    }

    onPageChanged(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updatePageData();
    }

    updatePageData(): void {
        const firstCut = this.pageIndex * this.pageSize;
        const secondCut = firstCut + this.pageSize;
        this._service.dataSource = this._service.masterData.slice(firstCut, secondCut);
    }

    get pageSize(): number {
        return this._pageSize;
    }

    set pageSize(value: number) {
        this._pageSize = value;
    }

    get pageIndex(): number {
        return this._pageIndex;
    }

    set pageIndex(value: number) {
        this._pageIndex = value;
    }
}
