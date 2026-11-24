import {HttpClient} from '@angular/common/http';
import {Component, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatSidenav} from '@angular/material/sidenav';
import {MatTabGroup} from '@angular/material/tabs';
import {ActivatedRoute, Router} from '@angular/router';
import {ImportService, PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';
import {ProjectService} from '../project-builder/project.service';
import {ModelImportService} from './model-import-service';
import {EditModeService} from './edit-mode/edit-mode.service';
import {HistoryService} from './services/history/history.service';
import {ModelService} from './services/model/model.service';
import {ProcessFileService} from './services/process-file/process-file.service';

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
        private historyService: HistoryService,
        private modelImportService: ModelImportService,
        private processFileService: ProcessFileService,
        private snackBar: MatSnackBar,
    ) {
        this.projectModels = this.projectService.models;
        this.route.queryParams.subscribe(params => {
            if (params.process && params.modelUrl) {
                this.snackBar.open('Use either process or modelUrl, not both.', 'X');
                this.router.navigate(['/modeler']);
                return;
            }
            if (params.process) {
                if (this.processFileService.isCurrentProcess(params.process)) {
                    return;
                }
                this.processFileService.loadProcess(params.process).subscribe({
                    next: loaded => this.modelImportService.importFromXml(loaded.xml, true, false),
                    error: error => {
                        this.snackBar.open(error?.message ?? 'Unable to open process file.', 'X');
                        this.router.navigate(['/modeler']);
                    },
                });
                return;
            }
            if (params.modelUrl) {
                this.processFileService.clearCurrentProcess();
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
