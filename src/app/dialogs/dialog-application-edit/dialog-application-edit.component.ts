import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatDialog} from '@angular/material/dialog';
import {ExportUtils, ImportService} from '@netgrif/petriflow';
import {ModelChange} from '../../modeler/history-mode/model/model/model-change';
import {HistoryService} from '../../modeler/services/history/history.service';
import Application from '../../project-builder/application';
import ApplicationPackageImport from '../../project-builder/application-package-import';
import {ApplicationService} from '../../project-builder/application.service';
import {DialogModelEditComponent} from '../dialog-model-edit/dialog-model-edit.component';
import {ApplicationPackageExport} from "../../project-builder/application-package-export";
import {ModelExportService} from "../../modeler/services/model/model-export.service";
import {DialogErrorsComponent} from "../dialog-errors/dialog-errors.component";
import {ModelService} from "../../modeler/services/model/model.service";
import {
    SnackBarHorizontalPosition,
    SnackBarService,
    SnackBarVerticalPosition
} from "@netgrif/components-core";

@Component({
    selector: 'nab-dialog-application-edit',
    templateUrl: './dialog-application-edit.component.html',
    styleUrl: './dialog-application-edit.component.scss',
})
export class DialogApplicationEditComponent {

    readonly chipSeparators = [ENTER, COMMA] as const;

    @ViewChild('appPkgFileInput') fileInput: ElementRef;
    public fileInputLoading: boolean;
    public exportLoading: boolean;
    private packageImporter: ApplicationPackageImport;
    private packageExporter: ApplicationPackageExport;
    public idCtrl: FormControl;
    public nameCtrl: FormControl;
    public versionCtrl: FormControl;

    constructor(
        public applicationService: ApplicationService,
        private importService: ImportService,
        private exportService: ModelExportService,
        private dialog: MatDialog,
        private historyService: HistoryService,
        private exportUtils: ExportUtils,
        private snackBarService: SnackBarService,
        private modelService: ModelService
    ) {
        this.idCtrl = new FormControl('', [
            Validators.required,
        ]);
        this.nameCtrl = new FormControl('', [
            Validators.required,
        ]);
        this.versionCtrl = new FormControl('', [
            Validators.required,
        ]);
        this.fileInputLoading = false;
        this.exportLoading = false;
        this.packageImporter = new ApplicationPackageImport(this.importService);
        this.packageExporter = new ApplicationPackageExport(this.exportUtils, this.exportService);
    }


    exportApplication($event: Event) {
        $event.stopPropagation();
        this.exportLoading = true;
        this.packageExporter.generatePackageFile(this.applicationService.application, this.applicationService.models)
            .catch(err => {
                console.error(err);
            }).finally(() => {
                this.exportLoading = false;
            });
    }

    importApplication($event: Event) {
        $event.stopPropagation();
        const file = ($event.target as HTMLInputElement).files[0];
        this.fileInputLoading = true;
        this.packageImporter.processPackageFile(file).then(result => {
            console.log(result);
            this.applicationService.models.clear();
            this.applicationService.application = result.application ? result.application : Application.getEmpty();

            result.models.forEach(model => {
                this.applicationService.addModel(model.model);
            });
            this.applicationService.switchToFirst();

            if (result.models.some(netResult => netResult.errors.length !== 0 || netResult.warnings.length !== 0)) {
                this.dialog.open(DialogErrorsComponent, {
                    width: '60%',
                    panelClass: "dialog-width-60",
                    data: {
                        models: result.models
                    }
                });
            } else {
                this.snackBarService.openSuccessSnackBar("Application " + result.application.name + " imported successfully.", SnackBarVerticalPosition.BOTTOM, SnackBarHorizontalPosition.CENTER, 5000);
            }
        }).catch(error => {
            console.error(error);
            this.snackBarService.openErrorSnackBar(error.message, SnackBarVerticalPosition.BOTTOM, SnackBarHorizontalPosition.CENTER);
            this.modelService.model = undefined;
        }).finally(() => {
            this.fileInputLoading = false;
        });
        this.fileInput.nativeElement.value = '';
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
                    this.historyService.save(`Model has been changed.`, changedModel.model); // TODO sprav historiu pre všetky procesy
                }
            }
        });
    }

    public hasErrors(): boolean {
        return this.idCtrl.invalid || this.nameCtrl.invalid || this.versionCtrl.invalid;
    }

}
