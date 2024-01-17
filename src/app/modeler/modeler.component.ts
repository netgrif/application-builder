import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {ActivatedRoute, Router} from '@angular/router';
import {SimulationModeService} from './simulation-mode/simulation-mode.service';
import {DataModeService} from './data-mode/data-mode.service';
import {RoleModeService} from './role-mode/role-mode.service';
import {ActionsModeService} from './actions-mode/actions-mode.service';
import {ResizeEvent} from 'angular-resizable-element';
import {MatDialog} from '@angular/material/dialog';
import {MatTabGroup} from '@angular/material/tabs';
import {MatSidenav} from '@angular/material/sidenav';
import {ImportService, PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';
import {ProjectService} from '../project-builder/project.service';
import {ModelerTabsService} from './services/modeler-tabs.service';
import {HttpClient} from '@angular/common/http';
import {ModelExportService} from './services/model/model-export.service';
import {EditModeService} from './edit-mode/edit-mode.service';
import {ModelService} from './services/model/model.service';

@Component({
    selector: 'nab-modeler',
    templateUrl: './modeler.component.html',
    styleUrls: ['./modeler.component.scss']
})
export class ModelerComponent {
    selectedIndex = 0;
    width: number;
    projectModels: Array<PetriflowPetriNet>;

    @ViewChild('tabs') tabGroup: MatTabGroup;
    @ViewChild('sidenav') nav: MatSidenav;

    constructor(private modelService: ModelService, private router: Router,
                private simulService: SimulationModeService, private dataService: DataModeService, private roleService: RoleModeService,
                private actionsModeService: ActionsModeService, public dialog: MatDialog, private exportService: ModelExportService,
                private _hotkeysService: HotkeysService, private projectService: ProjectService, private modelerTabsService: ModelerTabsService,
                private route: ActivatedRoute, private httpClient: HttpClient, private _importService: ImportService,
                private _petriflowCanvasService: EditModeService) {
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
            this.modelService.model = new PetriflowPetriNet();
        }
    }

    reset(field: string) {
        this._petriflowCanvasService.reset();
    }

    onResizeEvent(event: ResizeEvent): void {
        if (event.rectangle.width > 450) {
            this.width = 450;
        } else if (event.rectangle.width < 200) {
            this.width = 200;
        } else {
            this.width = event.rectangle.width;
        }
    }
}
