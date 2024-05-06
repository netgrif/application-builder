import {AfterViewInit, Component, HostListener} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {DialogConfirmComponent} from './dialogs/dialog-confirm/dialog-confirm.component';
import {TutorialService} from './tutorial/tutorial-service';
import {MortgageService} from './modeler/mortgage.service';
import {Router} from '@angular/router';
import {LanguageService} from '@netgrif/components-core';
import {NetgrifApplicationEngine} from '@netgrif/components-core/';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {DialogConfirmComponent} from './dialogs/dialog-confirm/dialog-confirm.component';
import {
    DialogLocalStorageModelComponent,
} from './dialogs/dialog-local-storage-model/dialog-local-storage-model.component';
import {ModelImportService} from './modeler/model-import-service';
import {ModelerConfig} from './modeler/modeler-config';
import {MortgageService} from './modeler/mortgage.service';
import {ModelService} from './modeler/services/model/model.service';
import {TutorialService} from './tutorial/tutorial-service';
import {JoyrideService} from 'ngx-joyride';

@Component({
    selector: 'nab-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    title = 'Netgrif Application Builder';
    config: NetgrifApplicationEngine;

    // @HostListener('window:beforeunload', ['$event'])
    // WindowBeforeUnload($event: any) {
    //     $event.returnValue = 'Your data will be lost!';
    // }

    constructor(
        config: AppBuilderConfigurationService,
        private router: Router,
        private matDialog: MatDialog,
        private readonly joyrideService: JoyrideService,
        private _mortgageService: MortgageService,
        private tutorialService: TutorialService,
        private modelService: ModelService,
        private importService: ModelImportService,
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
                this.importService.importFromXml(oldModel);
            } else if (result === false) {
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
