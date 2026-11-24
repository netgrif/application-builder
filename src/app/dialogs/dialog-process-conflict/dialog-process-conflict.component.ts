import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface ProcessConflictDialogData {
    process: string;
    reason: 'changed' | 'missing' | 'exists';
}

@Component({
    selector: 'nab-dialog-process-conflict',
    templateUrl: './dialog-process-conflict.component.html',
})
export class DialogProcessConflictComponent {

    constructor(@Inject(MAT_DIALOG_DATA) public data: ProcessConflictDialogData) {
    }

}
