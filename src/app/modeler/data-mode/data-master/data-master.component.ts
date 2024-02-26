import {Component, OnInit, ViewChild} from '@angular/core';
import {DataMasterDetailService} from '../data-master-detail.service';
import {MatSort, Sort} from '@angular/material/sort';
import {DataVariable} from '@netgrif/petriflow';
import {PageEvent} from '@angular/material/paginator';

@Component({
    selector: 'nab-data-master',
    templateUrl: './data-master.component.html',
    styleUrl: './data-master.component.scss'
})
export class DataMasterComponent implements OnInit {
    private _pageData: Array<DataVariable>;
    private _allData: Array<DataVariable>;
    private _pageSize: number;
    private _pageIndex: number;
    private _pageSizeOptions: Array<number> = [10, 20, 50, 100];
    @ViewChild(MatSort, {static: true}) private _sort: MatSort;

    constructor(
        private _service: DataMasterDetailService
    ) {
    }

    ngOnInit(): void {
        this.pageSize = 20;
        this.pageIndex = 0;
        this._allData = this._service.allData;
        this.updatePage();
    }

    create(): void {
        const newItem = this._service.create();
        this._service.select(newItem);
        // TODO: update page when newItem on next page
        // TODO: update total size
    }

    select(item: DataVariable): void {
        this.service.select(item);
    }

    onPageChanged(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updatePage();
    }

    sortData(event: Sort): void {
        // TODO: check condition
        if (!event.active || event.direction === '') {
            event.active = 'id';
            event.direction = 'asc';
        }
        this._allData = this._service.allData.toSorted((a: any, b: any) => {
            const isAsc = event.direction === 'asc';
            switch (event.active) {
                case 'name':
                    return this.compare(a.title.value, b.title.value, isAsc);
                case 'id':
                    return this.compare(a.id, b.id, isAsc);
            }
        });
        // TODO: go to first page after sort?
        this.updatePage();
    }

    updatePage(): void {
        const firstCut = this.pageIndex * this.pageSize;
        const secondCut = firstCut + this.pageSize;
        this._pageData = this._allData.slice(firstCut, secondCut);
    }

    compare(a: string, b: string, isAsc: boolean): number {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    get selected(): DataVariable {
        return this._service.getSelected();
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

    get sort(): MatSort {
        return this._sort;
    }

    set sort(value: MatSort) {
        this._sort = value;
    }

    get pageData(): Array<DataVariable> {
        return this._pageData;
    }

    get service(): DataMasterDetailService {
        return this._service;
    }

    get totalSize(): number {
        return this._allData.length;
    }

    get pageSizeOptions(): Array<number> {
        return this._pageSizeOptions;
    }
}
