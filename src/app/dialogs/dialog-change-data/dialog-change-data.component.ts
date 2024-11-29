import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormControl, ValidatorFn, Validators} from '@angular/forms';
import {CanvasTransition} from '../../modeler/edit-mode/domain/canvas-transition';
import {CanvasNodeElement} from '../../modeler/edit-mode/domain/canvas-node-element';

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
export class DialogChangeDataComponent {

    public dataSet: Array<Data>;
    public valueCtrl: FormControl;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DataSet,
    ) {
        this.dataSet = new Array<Data>();
        data.dataSet.forEach((value, id) => this.dataSet.push({id, value}));
        this.valueCtrl = new FormControl('', [
            Validators.required,
            this.validValue()
        ]);
    }

    private validValue(): ValidatorFn {
        return (fc: FormControl): { [key: string]: any } | null => {
            const value = Math.floor(fc.value as number);
            if (value !== Infinity && value === fc.value as number && value >= 0) {
                return null;
            }
            return ({validMultiplicity: true})
        };
    }
}
