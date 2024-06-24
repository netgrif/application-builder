import {AbstractMasterComponent} from './abstract-master.component';
import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatSort, Sort} from '@angular/material/sort';
import {PageEvent} from '@angular/material/paginator';

@Component({
    selector: 'nab-abstract-page-master-component',
    template: ''
})
export abstract class PageMaster extends AbstractMasterComponent implements OnInit {

    @Input()protected _pageSize: number = 20;
    protected _pageIndex: number;
    protected _pageData: Array<any>;
    protected _pageSizeOptions: Array<number> = [10, 20, 50];
    @ViewChild(MatSort, {static: true}) protected _sort: MatSort;

    protected constructor() {
        super();
    }

    ngOnInit(): void {
        this.pageIndex = 0;
        this._allData = this.masterService.allData;
        this.updatePage();

        this.masterService.getCreateEvent$().subscribe(newItem => {
            this.updateData();
            this.masterService.select(newItem);
        });
        this.masterService.getDeleteEvent$().subscribe(deletedItem => {
            this.updateData();
            if (this.selected === deletedItem) {
                this.masterService.select(undefined);
            }
        });
    }

    create(): void {
        this.masterService.create();
    }

    updateData(recalculatePageIndex: boolean = true) {
        this._allData = this.masterService.allData;
        if (recalculatePageIndex) {
            this.pageIndex = Math.ceil(this._allData.length / this.pageSize) - 1;
        }
        this.updatePage();
    }

    sortData(event: Sort): void {
        // TODO: check condition
        if (!event.active || event.direction === '') {
            event.active = 'id';
            event.direction = 'asc';
        }
        this._allData = this.masterService.getAllDataSorted(event);
        this.updatePage();
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

    get pageData(): Array<any> {
        return this._pageData;
    }

    get totalSize(): number {
        return this._allData.length;
    }

    get pageSizeOptions(): Array<number> {
        return this._pageSizeOptions;
    }

    onPageChanged(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updatePage();
    }

    updatePage(): void {
        const firstCut = this.pageIndex * this.pageSize;
        const secondCut = firstCut + this.pageSize;
        this._pageData = this._allData.slice(firstCut, secondCut);
    }
}
