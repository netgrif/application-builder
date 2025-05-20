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
    ErrorSnackBarComponent,
    SnackBarHorizontalPosition,
    SnackBarService,
    SnackBarVerticalPosition
} from "@netgrif/components-core";

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
        @Inject(MAT_DIALOG_DATA) public apps: Array<Application>,
        public applicationService: ApplicationService,
        private dialog: MatDialog,
        private importService: ImportService,
        private modelService: ModelService,
        private snackBarService: SnackBarService,
    ) {
        this.packageImporter = new ApplicationPackageImport(this.importService);
    }

    createNewApplication() {
        this.applicationService.createApplication();
        this.dialog.open(DialogApplicationEditComponent, {
            width: '50%',
            panelClass: 'dialog-width-50',
        });
    }

    openApplicationPackage($event: Event) {
        $event.stopPropagation();
        const file = ($event.target as HTMLInputElement).files[0];
        this.fileInputLoading = true;
        this.packageImporter.processPackageFile(file).then(result => {
            console.log(result);
            this.applicationService.application = result.application ? result.application : Application.getEmpty();

            if (result.models.length > 0) {
                this.modelService.model = result.models[0].model;
            }

            result.models.forEach(model => {
                this.applicationService.addModel(model.model);
            });

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
