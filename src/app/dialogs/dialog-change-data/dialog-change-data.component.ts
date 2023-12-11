import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DataSet {
    dataSet: Map<string, number>;
}

export interface Data {
    id: string,
    value: number
}

@Component({
    selector: 'nab-dialog-change-data',
    templateUrl: './dialog-change-data.component.html',
    styleUrls: ['./dialog-change-data.component.scss']
})
export class DialogChangeDataComponent implements OnInit {

    public dataSet: Array<Data>;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DataSet,
    ) {
        this.dataSet = new Array<Data>();
        data.dataSet.forEach((value, id) => this.dataSet.push({id, value}));
    }

    ngOnInit(): void {
    }

}
