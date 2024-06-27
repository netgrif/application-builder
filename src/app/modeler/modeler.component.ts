import {Component, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatTabGroup} from '@angular/material/tabs';
import {MatSidenav} from '@angular/material/sidenav';
import {ImportService, PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';
import {ProjectService} from '../project-builder/project.service';
import {HttpClient} from '@angular/common/http';
import {EditModeService} from './edit-mode/edit-mode.service';
import {ModelService} from './services/model/model.service';
import {HistoryService} from './services/history/history.service';

@Component({
    selector: 'nab-modeler',
    templateUrl: './modeler.component.html',
    styleUrls: ['./modeler.component.scss']
})
export class ModelerComponent {
    width: number;
    projectModels: Array<PetriflowPetriNet>;

    @ViewChild('tabs') tabGroup: MatTabGroup;
    @ViewChild('sidenav') nav: MatSidenav;

    constructor(
        private modelService: ModelService, private router: Router,
        public dialog: MatDialog,
        private projectService: ProjectService,
        private route: ActivatedRoute,
        private httpClient: HttpClient,
        private _importService: ImportService,
        private _petriflowCanvasService: EditModeService,
        private historyService: HistoryService
    ) {
        this.projectModels = this.projectService.models;
        this.route.queryParams.subscribe(params => {
            if (params.modelUrl) {
                httpClient.get(params.modelUrl, {
                    responseType: 'text'
                }).subscribe(data => {
                    try {
                        const model = this._importService.parseFromXml(data as string)?.model;
                        if (model) {
                            this.modelService.model = model;
                            this.historyService.save(`Model ${this.modelService.model.id} has been imported.`);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                    this.router.navigate(['/modeler/']);
                }, error => {
                    console.log(error);
                    this.router.navigate(['/modeler/']);
                });
            }
        });
        if (!this.modelService.model) {
            this.modelService.model = this.modelService.newModel();
            this.historyService.save(`New model has been created.`);
        }
    }
}
