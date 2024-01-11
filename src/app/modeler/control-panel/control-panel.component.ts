import {AfterViewInit, Component, EventEmitter, Input, Output} from '@angular/core';
import {CanvasService} from '../services/canvas.service';
import {ModelService} from '../services/model.service';
import {ImportService, PetriNet} from '@netgrif/petriflow';
import {Router} from '@angular/router';
import {ActionsModeService} from '../actions-mode/actions-mode.service';
import {I18nModeService} from '../i18n-mode/i18n-mode.service';
import {MatDialog} from '@angular/material/dialog';
import {MatSidenav} from '@angular/material/sidenav';
import {TutorialService} from '../../tutorial/tutorial-service';
import {DialogManageRolesComponent, RoleRefType} from '../../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {SimulationModeService} from '../simulation-mode/simulation-mode.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {DialogErrorsComponent} from '../../dialogs/dialog-errors/dialog-errors.component';
import {ModelExportService} from '../services/model-export.service';
import {ImportSuccessfulComponent} from './import-successful/import-successful.component';
import {FastPnService} from '../edit-mode/fast-pn.service';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Transition} from '../classes/transition/transition';
import {Place} from '../classes/place/place';
import {ActionEditorService} from '../actions-mode/action-editor/action-editor.service';
import {BpmnEditService} from '../edit-mode/bpmn-mode/bpmn-edit.service';

@Component({
    selector: 'nab-control-panel',
    templateUrl: './control-panel.component.html',
    styleUrls: ['./control-panel.component.scss']
})
export class ControlPanelComponent implements AfterViewInit {
    @Input() nav: MatSidenav;
    @Output() importModel: EventEmitter<void>;

    whichButton: string;
    modeSelect;

    selectedDatas = 'dataVariable';

    constructor(public canvasService: CanvasService, private exportService: ModelExportService, private modelService: ModelService,
                private importService: ImportService, public dialog: MatDialog, private router: Router, private http: HttpClient,
                private actionsModeService: ActionsModeService, public i18nModeService: I18nModeService,
                private tutorialService: TutorialService, private simulService: SimulationModeService, private _snackBar: MatSnackBar,
                public fastPnService: FastPnService, private actionEditorService: ActionEditorService, private bpmnEditService: BpmnEditService) {
        this.importModel = new EventEmitter<void>();
        this.modelService.whichButton.subscribe(obj => this.whichButton = obj);
        this.router.events.subscribe(() => {
            if (this.router.url.includes('/modeler')) {
                if (this.router.url === '/modeler') {
                    this.modeSelect = 'modeler';
                } else {
                    this.modeSelect = this.router.url.substring(9);
                }
            }
        });
        this.actionsModeService.eventData.subscribe(eventData => {
            this.selectedDatas = eventData;
        });
        this.modelService.dropZoneEvent.subscribe(event => {
            this.importModelFrom(event);
        });
    }

    ngAfterViewInit(): void {
        if (this.modelService.whichButton.getValue() === 'select') {
            this.sideNav();
        }
        this.fastPnService.controlPanelComponent.next(this);
    }

    undo() {
        // TODO: use event sourcing
        // this.canvasService.undo();
    }

    openModel(event: Event) {
        const file = (event.target as HTMLInputElement).files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.importModelFrom(reader.result as string);
        };
        reader.readAsText(file);
    }

    // TODO: refactor
    importModelFrom(originFile: string) {
        const petriNetResult = this.importService.parseFromXml(originFile);

        if (petriNetResult.errors.length + petriNetResult.warnings.length + petriNetResult.info.length > 0) {
            console.log('Petri net import errors:');
            petriNetResult.errors.forEach(e => console.log(e));

            this.dialog.open(DialogErrorsComponent, {
                maxWidth: '60%',
                data: {
                    errors: petriNetResult.errors,
                    warnings: petriNetResult.warnings,
                    info: petriNetResult.info
                }
            });
        } else {
            this._snackBar.openFromComponent(ImportSuccessfulComponent, {duration: 5000});
        }

        // TODO remove
        const fileInputField = document.getElementById('otvorSubor') as HTMLInputElement;
        fileInputField.value = '';

        if (petriNetResult.model !== undefined) {
            this.saveModel(petriNetResult.model);
            this.actionEditorService.updateIds(petriNetResult.model);
        }
        this.router.navigate(['/modeler']);
    }

    exportAsXML() {
        this.exportService.exportXML();
    }

    exportAsSVG() {
        this.exportService.exportSvg(this.canvasService.canvas.svg);
    }

    clearModel() {
        this.canvasService.clearmodel();
    }

    setDimension() {
        this.canvasService.setDimension();
    }

    alignElements() {
        this.canvasService.alignElements();
    }

    propertiesM() {
        this.canvasService.propertiesM();
    }

    about() {
        this.canvasService.about();
    }

    reset(field: string) {
        this.shutDownFastPn();
        this.canvasService.isActiveFastPn.next(false);
        this.modelService.whichButton.next(field);
        this.canvasService.reset();
    }

    resetI18n(field: string) {
        this.shutDownFastPn();
        this.canvasService.isActiveFastPn.next(false);
        this.i18nModeService.whichButton.next(field);
        this.canvasService.reset();
    }

    shutDownFastPn() {
        if (this.modelService.whichButton.getValue() === 'fire' || this.modelService.whichButton.getValue() === 'fire-task') {
            return;
        }
        if (['arc', 'resetarc', 'inhibitorarc', 'readarc'].includes(this.modelService.whichButton.getValue())) {
            this.canvasService.reset_hranu();
        }
        this.canvasService.isCustomFastPn.next(false);
        this.canvasService.isActiveFastPn.next(false);
        this.canvasService.startAgain.next(true);
        this.canvasService.hasBeenDone = false;
        this.fastPnService.actualMode = undefined;
        this.fastPnService.lastElement = undefined;
        this.fastPnService.preEndLastElement = undefined;
        this.modelService.hybesaprechod = 0;
        this.modelService.hybesamiesto = 0;
        this.modelService.movedmiesto = undefined;
        this.modelService.movedprechod = undefined;
        this.modelService.kresli_sa_hrana = 0;
        this.modelService.pocetmousedown = 0;
        this.modelService.pocetmousedownright = 0;
        this.canvasService.alignElements();
        console.log('shutdownFastPN was called')
    }

    removeLastElement() {
        const element = this.canvasService.fastPnService.lastElement;
        if (element instanceof Transition) {
            this.fastPnService.fastModeContext.getValue().removeTransition(element);
        } else if (element instanceof Place) {
            this.fastPnService.fastModeContext.getValue().removePlace(element);
        }
    }

    resetFast(field: string) {
        this.modelService.whichButton.next(field);
        this.canvasService.reset();
    }

    startFastPn() {
        this.canvasService.isCustomFastPn.next(true);
        this.canvasService.isActiveFastPn.next(true);
        this.modelService.pocetmousedownright = 0;
        this.fastPnService.switchToFastPn();
    }

    isActive(button: string) {
        return this.modelService.whichButton.getValue() === button && !this.isFastPn();
    }

    isActiveI18n(button: string) {
        return this.i18nModeService.whichButton.getValue() === button && !this.isFastPn();
    }

    isFastPn() {
        return this.canvasService.isCustomFastPn.getValue();
    }

    // Import BPMN file by upload
    importBpmn(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file)
        reader.onloadend = () => {
            this.bpmnEditService.importXml(reader.result as string)
        }
    }

    sideNav() {
        this.reset('select');
        this.canvasService.editSideNav = this.nav;
    }

    changeData(item: string) {
        this.selectedDatas = item;
        this.actionsModeService.eventData.next(item);
    }

    isActiveView(edit: string) {
        return edit === this.modeSelect;
    }

    isSelected(item: string) {
        return item === this.selectedDatas;
    }

    get tutorial() {
        return this.tutorialService;
    }

    modelMetaData() {
        this.canvasService.editSideNav = this.nav;
        this.canvasService.selectedTransition.next(undefined);
        this.nav.open();
    }

    manageProcessPermisions() {
        this.dialog.open(DialogManageRolesComponent, {
            width: '60%',
            data: {
                type: RoleRefType.PROCESS,
                roles: this.modelService.model.getRoles(),
                processRolesRefs: this.modelService.model.getRoleRefs(),
                processUserRefs: this.modelService.model.getUserRefs(),
                userLists: this.modelService.model.getDataSet().filter(item => item.type === 'userList')
            }
        });
    }

    private saveModel(model: PetriNet) {
        this.modelService.model = model;
        this.canvasService.renderModel(this.modelService.model);
        if (this.modeSelect === 'simulation') {
            this.simulService.originalModel.next(model);
            this.canvasService.reset();
        }
        this.importModel.emit();
    }

    refreshI18n() {
        this.i18nModeService.updateI18ns();
    }

    resetSimulation() {
        this.modelService.model = this.simulService.originalModel.getValue().clone();
        this.canvasService.renderModel(this.modelService.model);
        this.canvasService.reset();
    }

    get bpmnService() {
        return this.bpmnEditService;
    }
}
