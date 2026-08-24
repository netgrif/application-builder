import {Injectable, Injector} from '@angular/core';
import {DialogErrorsComponent} from '../dialogs/dialog-errors/dialog-errors.component';
import {ImportSuccessfulComponent} from './control-panel/import-successful/import-successful.component';
import {ImportService} from '@netgrif/petriflow';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {HistoryService} from './services/history/history.service';
import {ApplicationService} from '../project-builder/application.service';

@Injectable({
    providedIn: 'root'
})
export class ModelImportService {

    private _applicationService: ApplicationService;

    constructor(
        private importService: ImportService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private router: Router,
        private historyService: HistoryService,
        private injector: Injector,
    ) {
    }

    private get applicationService(): ApplicationService {
        if (!this._applicationService) {
            this._applicationService = this.injector.get(ApplicationService);
        }
        return this._applicationService;
    }

    public importFromXml(content: string): void {
        this.processXml(content, false);
    }

    public addProcessFromXml(content: string): void {
        this.processXml(content, true);
    }

    private processXml(content: string, addAsNewProcess: boolean): void {
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
        }

        if (petriNetResult.model !== undefined) {
            const imported = addAsNewProcess
                ? this.applicationService.addModel(petriNetResult.model)
                : this.applicationService.replaceActiveModel(petriNetResult.model);

            if (imported) {
                if (petriNetResult.errors.length + petriNetResult.warnings.length + petriNetResult.info.length === 0) {
                    this.snackBar.openFromComponent(ImportSuccessfulComponent, {duration: 5000});
                }
                if (!addAsNewProcess) {
                    this.historyService.save(`Model ${petriNetResult.model.id} has been imported.`, petriNetResult.model);
                }
            } else {
                this.snackBar.open(
                    `A process with identifier ${petriNetResult.model.id} already exists in this application.`,
                    'Close',
                    {duration: 5000},
                );
            }
        }
        if (!addAsNewProcess) {
            this.router.navigate(['/modeler']);
        }
    }
}
