import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {ImportService} from '@netgrif/petriflow';
import Application from '../../project-builder/application';
import ApplicationPackageImport from '../../project-builder/application-package-import';
import {ApplicationService} from '../../project-builder/application.service';
import {DialogApplicationEditComponent} from '../dialog-application-edit/dialog-application-edit.component';
import {ModelService} from "../../modeler/services/model/model.service";
import {DialogErrorsComponent} from "../dialog-errors/dialog-errors.component";
import {
    SnackBarHorizontalPosition,
    SnackBarService,
    SnackBarVerticalPosition
} from "@netgrif/components-core";
import {
    DatabaseStorageService,
    SavedApplicationSummary
} from '../../project-builder/database-storage.service';
import {DialogDeleteComponent} from '../dialog-delete/dialog-delete.component';

@Component({
    selector: 'nab-dialog-intro',
    templateUrl: './dialog-intro.component.html',
    styleUrl: './dialog-intro.component.scss',
})
export class DialogIntroComponent {

    @ViewChild('appPkgFileInput') fileInput: ElementRef;
    fileInputLoading = false;

    private packageImporter: ApplicationPackageImport;

    constructor(
        @Inject(MAT_DIALOG_DATA) public apps: Array<SavedApplicationSummary>,
        public applicationService: ApplicationService,
        private dialog: MatDialog,
        private importService: ImportService,
        private modelService: ModelService,
        private snackBarService: SnackBarService,
        private databaseStorageService: DatabaseStorageService,
    ) {
        this.packageImporter = new ApplicationPackageImport(this.importService);
    }

    createNewApplication() {
        this.databaseStorageService.startNewApplication();
        this.applicationService.createApplication();
        this.dialog.open(DialogApplicationEditComponent, {
            width: '50%',
            panelClass: 'dialog-width-50',
        });
    }

    openSavedApplication(storageId: string): void {
        const savedApplication = this.databaseStorageService.getApplication(storageId);
        if (!savedApplication) {
            this.snackBarService.openErrorSnackBar(
                'The saved application could not be found.',
                SnackBarVerticalPosition.BOTTOM,
                SnackBarHorizontalPosition.CENTER,
            );
            return;
        }

        try {
            const results = savedApplication.processes.map(process => this.importService.parseFromXml(process.xml));
            this.applicationService.models.clear();
            this.applicationService.application = savedApplication.application;
            results.forEach(result => {
                if (result.model) {
                    this.applicationService.addModel(result.model);
                }
            });
            this.applicationService.updateProcesses();
            this.applicationService.switchToFirst();
            if (!savedApplication.legacy) {
                this.databaseStorageService.discardLegacyDraft();
            }
            this.dialog.closeAll();

            if (results.some(result => result.errors.length !== 0 || result.warnings.length !== 0 || result.info.length !== 0)) {
                this.dialog.open(DialogErrorsComponent, {
                    width: '60%',
                    panelClass: 'dialog-width-60',
                    data: {
                        models: results,
                    },
                });
            } else {
                this.snackBarService.openSuccessSnackBar(
                    `Application ${savedApplication.application.name} loaded.`,
                    SnackBarVerticalPosition.BOTTOM,
                    SnackBarHorizontalPosition.CENTER,
                    5000,
                );
            }
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : String(error);
            this.snackBarService.openErrorSnackBar(
                message,
                SnackBarVerticalPosition.BOTTOM,
                SnackBarHorizontalPosition.CENTER,
            );
        }
    }

    deleteSavedApplication(savedApplication: SavedApplicationSummary): void {
        this.dialog.open(DialogDeleteComponent, {
            data: {
                title: 'Delete saved application',
                message: `Permanently delete "${savedApplication.application.name}" from this browser?`,
                confirmLabel: 'Delete',
            },
        }).afterClosed().subscribe(confirmed => {
            if (confirmed && this.databaseStorageService.deleteApplication(savedApplication.storageId)) {
                this.apps = this.apps.filter(application => application.storageId !== savedApplication.storageId);
                this.snackBarService.openSuccessSnackBar(
                    `Saved application ${savedApplication.application.name} deleted.`,
                    SnackBarVerticalPosition.BOTTOM,
                    SnackBarHorizontalPosition.CENTER,
                    5000,
                );
            }
        });
    }

    openApplicationPackage($event: Event) {
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

            this.dialog.closeAll();
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
}
