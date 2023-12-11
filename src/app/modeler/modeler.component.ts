import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {ModelService} from './services/model.service';
import {CanvasService} from './services/canvas.service';
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
import {PetriNet} from './classes/petri-net';
import {ProjectService} from '../project-builder/project.service';
import {ModelerTabsService} from './services/modeler-tabs.service';
import {ModelExportService} from './services/model-export.service';
import {HttpClient} from '@angular/common/http';

@Component({
    selector: 'nab-modeler',
    templateUrl: './modeler.component.html',
    styleUrls: ['./modeler.component.scss']
})
export class ModelerComponent implements AfterViewInit {
    selectedIndex = 0;
    width: number;
    projectModels: Array<PetriflowPetriNet>;

    @ViewChild('tabs') tabGroup: MatTabGroup;
    @ViewChild('sidenav') nav: MatSidenav;

    constructor(private modelService: ModelService, private canvasService: CanvasService, private router: Router,
                private simulService: SimulationModeService, private dataService: DataModeService, private roleService: RoleModeService,
                private actionsModeService: ActionsModeService, public dialog: MatDialog, private exportService: ModelExportService,
                private _hotkeysService: HotkeysService, private projectService: ProjectService, private modelerTabsService: ModelerTabsService,
                private route: ActivatedRoute, private httpClient: HttpClient, private _importService: ImportService) {
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
                            this.canvasService.renderModel(this.modelService.model);
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
            this.modelService.graphicModel = new PetriNet(this.modelService.model);
        }

        this.modelerTabsService.openTab.subscribe((model: PetriflowPetriNet) => {
            if (this.modelService.isEmptyModel()) {
                this.projectService.models[this.selectedIndex] = model;
                this.routerCheck(model);
            } else {
                this.addTab(model);
            }
        });

        this._hotkeysService.add(new Hotkey('ctrl+s', (event: KeyboardEvent): boolean => {
            this.exportService.exportXML();
            return false;
        }));
        this._hotkeysService.add(new Hotkey('ctrl+u', (event: KeyboardEvent): boolean => {
            this.canvasService.undo();
            return false;
        }));
        this._hotkeysService.add(new Hotkey('del', (event: KeyboardEvent): boolean => {
            this.modelService.whichButton.next('delete');
            this.canvasService.reset();
            return false;
        }));
        this._hotkeysService.add(new Hotkey('shift+tab', (event: KeyboardEvent): boolean => {
            if (this.tabGroup.selectedIndex === this.tabGroup._tabs.length - 1) {
                this.tabGroup.selectedIndex = 0;
            } else {
                this.tabGroup.selectedIndex = this.tabGroup.selectedIndex + 1;
            }
            return false;
        }));
    }

    ngAfterViewInit() {
        this.canvasService.openSideNav.subscribe(bool => {
            if (bool) {
                this.canvasService.editSideNav = this.nav;
                this.canvasService.selectedTransition.next(undefined);
                this.nav.open();
            }
        });
    }

    reset(field: string) {
        this.modelService.whichButton.next(field);
        this.canvasService.reset();
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

    async onTabChange(index: number) {
        this.selectedIndex = index;
        this.routerCheck(this.projectService.models[index]);
    }

    openModel(mode: string) {
        if (mode === 'simulation') {
            this.simulService.modelClone();
        }
        this.canvasService.renderModel(this.modelService.model);
        if (mode === 'simulation') {
            this.reset('fire');
        } else {
            this.canvasService.reset();
        }
    }

    private routerCheck(model: PetriflowPetriNet) {
        this.modelService.model = model;
        if (this.router.url === '/modeler') {
            this.openModel('edit');
        } else if (this.router.url === '/modeler/simulation') {
            this.openModel('simulation');
        } else if (this.router.url === '/modeler/data') {
            this.dataService.event.next();
        } else if (this.router.url === '/modeler/roles') {
            this.roleService.event.next();
        } else if (this.router.url === '/modeler/actions') {
            this.actionsModeService.eventData.next(this.actionsModeService.eventData.getValue());
        } else if (this.router.url === '/modeler/i18n') {
        } else if (this.router.url === '/modeler/form') {
        }
    }

    addTab(model = new PetriflowPetriNet()) {
        this.projectService.models.push(model);
        this.routerCheck(model);
        this.selectedIndex = this.projectService.models.length - 1;
    }
}
