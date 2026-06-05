import {AfterViewInit, Component, HostListener} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {NetgrifApplicationEngine} from '@netgrif/components-core/';
import {JoyrideService} from 'ngx-joyride';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {DialogConfirmComponent} from './dialogs/dialog-confirm/dialog-confirm.component';
import {
  DialogLocalStorageModelComponent,
} from './dialogs/dialog-local-storage-model/dialog-local-storage-model.component';
import {BpmnStateService} from './modeler/bpmn-mode/bpmn-state.service';
import {EnrichmentService} from './modeler/bpmn-mode/enrichment.service';
import {ModelImportService} from './modeler/model-import-service';
import {ModelerConfig} from './modeler/modeler-config';
import {MortgageService} from './modeler/mortgage.service';
import {ModelService} from './modeler/services/model/model.service';
import {TutorialService} from './tutorial/tutorial-service';

@Component({
    selector: 'nab-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    title = 'Netgrif Application Builder';
    config: NetgrifApplicationEngine;

    @HostListener('window:beforeunload', ['$event'])
    WindowBeforeUnload($event: any) {
        $event.returnValue = 'Your data will be lost!';
    }

    constructor(
        config: AppBuilderConfigurationService,
        private router: Router,
        private matDialog: MatDialog,
        private readonly joyrideService: JoyrideService,
        private _mortgageService: MortgageService,
        private tutorialService: TutorialService,
        private modelService: ModelService,
        private importService: ModelImportService,
        private bpmnState: BpmnStateService,
        private enrichment: EnrichmentService,
    ) {
        this.config = config.get();
    }

    ngAfterViewInit(): void {
        // TODO: NAB-326 https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
        const oldModel = localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY);
        if (!oldModel) {
            return;
        }
        const dialogRef = this.matDialog.open(DialogLocalStorageModelComponent, {
            data: {
                id: localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID),
                timestamp: localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP),
                title: localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE),
            },
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                // Load the Petriflow draft AND keep it consistent with the persisted
                // BPMN diagram: if this was a BPMN project, restore the BPMN origin so
                // the BPMN editor stays reachable and shows the saved diagram.
                this.importService.importFromXml(oldModel);
                if (this.bpmnState.isBpmnProject) {
                    this.modelService.modelOrigin = 'bpmn';
                }
            } else if (result === false) {
                // Delete previous work: wipe BOTH the Petriflow draft and the BPMN
                // diagram + enrichment (in-memory singletons + their localStorage).
                this.bpmnState.clear();
                this.enrichment.clear();
                this.modelService.modelOrigin = 'none';
                localStorage.clear();
            }
        });
    }

    addMortgage() {
        const dialogRef = this.matDialog.open(DialogConfirmComponent);

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this._mortgageService.loadModel();
                this.router.navigate(['/modeler']);
            }
        });
    }

    help() {
        this.joyrideService.startTour({
            steps: this.tutorialService.steps,
            themeColor: '#0f4c81dd',
        });
    }

    get tutorial() {
        return this.tutorialService;
    }

    openInTab(url: string) {
        window.open(url, '_blank');
    }
}
