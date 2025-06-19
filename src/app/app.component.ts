import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {NetgrifApplicationEngine} from '@netgrif/components-core/';
import {JoyrideService} from 'ngx-joyride';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {DialogApplicationEditComponent} from './dialogs/dialog-application-edit/dialog-application-edit.component';
import {DialogIntroComponent} from './dialogs/dialog-intro/dialog-intro.component';
import {MortgageService} from './modeler/mortgage.service';
import {ModelService} from './modeler/services/model/model.service';
import {ApplicationService} from './project-builder/application.service';
import {DatabaseStorageService} from './project-builder/database-storage.service';
import {TutorialService} from './tutorial/tutorial-service';
import {MatTabChangeEvent} from '@angular/material/tabs';

@Component({
    selector: 'nab-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
    title = 'Netgrif Application Builder';
    config: NetgrifApplicationEngine;

    @HostListener('window:beforeunload', ['$event'])
    WindowBeforeUnload($event: any) {
        $event.returnValue = 'Your data will be lost!';
    }

    constructor(
        config: AppBuilderConfigurationService,
        private matDialog: MatDialog,
        private readonly joyrideService: JoyrideService,
        private _mortgageService: MortgageService,
        private tutorialService: TutorialService,
        private db: DatabaseStorageService,
        public modelService: ModelService,
        public applicationService: ApplicationService,
    ) {
        this.config = config.get();
    }

    ngOnInit(): void {
        this.applicationService.createApplication();
        this.applicationService.switchToFirst();
    }

    ngAfterViewInit(): void {
        // TODO: NAB-326 https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
        const apps = this.db.getAllApplications();
        if (apps && apps.length > 0) {
            this.matDialog.open(DialogIntroComponent, {
                width: '40%',
                panelClass: 'dialog-width-40',
                disableClose: true,
                data: apps,
            });
        }
    }

    openApplicationDialog() {
        this.matDialog.open(DialogApplicationEditComponent, {
            width: '50%',
            panelClass: 'dialog-width-50',
        });
    }

    addMortgage() {
        this._mortgageService.loadModel();
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

    switchToProcess(processId: string): void {
        this.applicationService.switchActiveModel(processId);
    }

    changeTab(tabEvent: MatTabChangeEvent): void {
        this.switchToProcess(tabEvent.tab.textLabel);
    }

    addNewEmptyModel(): void {
        const model = this.applicationService.addNewEmptyModel();
        this.applicationService.switchActiveModel(model.id);
    }

    activeProcessIndex(): number {
        return this.applicationService.modelList.indexOf(this.applicationService.getActiveModel()) + 1;
    }
}
