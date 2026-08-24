import {Component, Inject, Optional} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DialogDeleteData {
    title: string;
    message: string;
    confirmLabel: string;
}

@Component({
  selector: 'nab-dialog-delete',
  templateUrl: './dialog-delete.component.html',
  styleUrls: ['./dialog-delete.component.scss'],
})
export class DialogDeleteComponent {

    readonly data: DialogDeleteData;

    constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: DialogDeleteData | null) {
        this.data = data || {
            title: 'Delete confirmation',
            message: 'Are you sure you want to delete this item?',
            confirmLabel: 'Confirm',
        };
    }
}
