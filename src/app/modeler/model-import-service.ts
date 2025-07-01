import {Injectable} from '@angular/core';
import {DialogErrorsComponent} from '../dialogs/dialog-errors/dialog-errors.component';
import {ImportSuccessfulComponent} from './control-panel/import-successful/import-successful.component';
import {ImportService} from '@netgrif/petriflow';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ApplicationService} from '../project-builder/application.service';
import {Router} from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class ModelImportService {

    constructor(
        private importService: ImportService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private _appService: ApplicationService,
        private router: Router,
    ) {
    }

    public importFromXml(content: string): void {
        const petriNetResult = this.importService.parseFromXml(content);

        if (petriNetResult.errors.length + petriNetResult.warnings.length + petriNetResult.info.length > 0) {
            console.log('Petri net import errors:');
            petriNetResult.errors.forEach(e => console.log(e));

            this.dialog.open(DialogErrorsComponent, {
                width: '60%',
                panelClass: "dialog-width-60",
                data: {
                    models: [petriNetResult]
                }
            });
        } else {
            this.snackBar.openFromComponent(ImportSuccessfulComponent, {duration: 5000});
        }

        if (petriNetResult.model !== undefined) {
            this._appService.addModel(petriNetResult.model);
            this._appService.switchActiveModel(petriNetResult.model.id);
            this.router.navigate(['/modeler']);
        }
    }
}
