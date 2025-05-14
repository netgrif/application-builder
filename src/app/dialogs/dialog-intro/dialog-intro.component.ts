import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import {ImportService} from '@netgrif/petriflow';
import Application from '../../project-builder/application';
import ApplicationPackageImport from '../../project-builder/application-package-import';
import {ApplicationService} from '../../project-builder/application.service';
import {DialogApplicationEditComponent} from '../dialog-application-edit/dialog-application-edit.component';

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
            result.models.forEach(model => {
                this.applicationService.addModel(model.model);
            });
            this.dialog.closeAll();
            // TODO ukázať dialog s tím akú aplikáciu to načítalo
        }).catch(error => {
            console.error(error);
            // TODO show error dialog
        }).finally(() => {
            this.fileInputLoading = false;
        });
        this.fileInput.nativeElement.value = '';
    }
}
