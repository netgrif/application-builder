import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, OnInit} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatDialog} from '@angular/material/dialog';
import {ModelChange} from '../../modeler/history-mode/model/model/model-change';
import {HistoryService} from '../../modeler/services/history/history.service';
import {ApplicationService} from '../../project-builder/application.service';
import {DialogModelEditComponent} from '../dialog-model-edit/dialog-model-edit.component';

@Component({
    selector: 'nab-dialog-application-edit',
    templateUrl: './dialog-application-edit.component.html',
    styleUrl: './dialog-application-edit.component.scss',
})
export class DialogApplicationEditComponent implements OnInit {

    readonly chipSeparators = [ENTER, COMMA] as const;

    public form: FormControl;

    constructor(
        public applicationService: ApplicationService,
        private dialog: MatDialog,
        private historyService: HistoryService,
    ) {
        this.form = new FormControl('', [
            Validators.required,
        ]);
    }

    ngOnInit(): void {
    }

    exportApplication() {
    }

    importApplication() {
    }

    addTag(event: MatChipInputEvent): void {
        const tag = (event.value || '').trim();
        if (tag) this.applicationService.application.tags.push(tag);
        event.chipInput!.clear();
    }

    removeTag(tag: string): void {
        const index = this.applicationService.application.tags.indexOf(tag);
        if (index >= 0) {
            this.applicationService.application.tags.splice(index, 1);
        }
    }

    editProcess(processId: string) {
        this.dialog.open(DialogModelEditComponent, {
            width: '50%',
            panelClass: 'dialog-width-50',
            data: new ModelChange(this.applicationService.getModel(processId), this.applicationService.getModel(processId).clone()),
        }).afterClosed().subscribe(value => {
            const changedModel = value as ModelChange;
            if (changedModel != undefined) {
                if (changedModel.model.id !== processId) {
                    this.applicationService.updateModelId(processId, changedModel.model.id);
                }
                this.applicationService.models.set(changedModel.model.id, changedModel.model);
                if (changedModel) {
                    this.historyService.save(`Model has been changed.`); // TODO sprav historiu pre všetky procesy
                }
            }
        });
    }

}
