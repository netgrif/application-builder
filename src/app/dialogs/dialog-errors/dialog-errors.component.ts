import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {PetriNetResult} from "@netgrif/petriflow";

export interface DialogErrorsData {
    models: PetriNetResult[];
}

@Component({
    selector: 'nab-dialog-errors',
    templateUrl: './dialog-errors.component.html',
    styleUrls: ['./dialog-errors.component.scss']
})
export class DialogErrorsComponent {

    constructor(@Inject(MAT_DIALOG_DATA) public data: DialogErrorsData) {
    }
}
