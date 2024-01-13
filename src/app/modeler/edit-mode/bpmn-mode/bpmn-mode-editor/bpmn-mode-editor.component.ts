import {AfterContentInit, Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';

import {HttpClient} from '@angular/common/http';

/**
 * You may include a different variant of BpmnJS:
 *
 * bpmn-viewer  - displays BPMN diagrams without the ability
 *                to navigate them
 * bpmn-modeler - bootstraps a full-fledged BPMN editor
 */
import * as BpmnJS from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import {BpmnEditService} from '../bpmn-edit.service';

import {DataGroup, ImportService} from '@netgrif/petriflow';
import {ModelerConfig} from '../../../modeler-config';
import {ModelService} from '../../../services/model.service';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'nab-bpmn-mode-editor',
  templateUrl: './bpmn-mode-editor.component.html',
  styleUrls: ['./bpmn-mode-editor.component.scss']
})
export class BpmnModeEditorComponent implements AfterContentInit, OnDestroy {

    // instantiate BpmnJS with component
    private bpmnJS: BpmnJS;

    // retrieve DOM element reference
    @ViewChild('bpmnDiagram', { static: true }) private el: ElementRef;

    @Input() private url: string;

    constructor(private http: HttpClient,
                private BpmnService: BpmnEditService,
                private modelService: ModelService,
                private transitionService: SelectedTransitionService,
                private router: Router,
                private _snackBar: MatSnackBar,
                private importService: ImportService
    ) {
        this.bpmnJS = this.BpmnService.modeler
    }

    ngAfterContentInit(): void {
        if(this.bpmnJS === null || this.bpmnJS === undefined) {
            this.bpmnJS = this.BpmnService.modeler
        }
        // attach BpmnJS instance to DOM element
        this.bpmnJS.attachTo(document.getElementById('bpmnDiagram'));
        const propertiesContainer = document.getElementById('properties');
        const propertiesPanel = this.bpmnJS.get('propertiesPanel');
        propertiesPanel.attachTo(propertiesContainer);
        this.bpmnJS.on('import.done', ({ error }) => {
            if (!error) {
                this.bpmnJS.get('canvas').zoom('fit-viewport');
            }
        });
        if(!this.BpmnService.isActionRegistered('open.formBuilder')) {
            this.bpmnJS.get('eventBus').on('open.formBuilder', (ev, el) => {
                this.updateModelAndRedirect(this.openFormBuilder, el.element.id)
                console.log('Element open forms clicked: ', el)
            });
            this.bpmnJS.get('eventBus').on('open.actionBuilder', (ev, el) => {
                this.updateModelAndRedirect(this.openActions, el.element.id)
                console.log('Element open actions clicked: ', el)
            });
            this.bpmnJS.get('eventBus').on('element.changed', (ev, el) => {
                this.BpmnService.updatePetriflowTaskId(el.element.id)
            });
        }
    }

    // Updates Petriflow net before redirection to other views from edit view
    updateModelAndRedirect(redirectFunction: (transId:string) => void, taskId:string) {
        if(this.bpmnJS === null || this.bpmnJS === undefined) {
            this.bpmnJS = this.BpmnService.modeler
        }
        const transId = taskId + '_t'
        this.BpmnService.convertCurrentBpmn()
        setTimeout(() => {
            console.log('Redirecting...', redirectFunction.name)
            redirectFunction.call(this, transId)
        },400)
    }

    // Method is called when redirecting from bpmn edit mode to form editor, using contextPad action on bpmn elem.
    openFormBuilder(id) {
        if(!this.modelService.model.getTransition(id)) {
            this.router.navigate(['/modeler']);
            return
        }
        const transition = this.modelService.model.getTransition(id);
        this.transitionService.id = id
        this.router.navigate(['/form']);
        if (transition.dataGroups.length === 0) {
            const dataGroup = new DataGroup(`${transition.id}_0`);
            dataGroup.layout = ModelerConfig.LAYOUT_DEFAULT_TYPE;
            dataGroup.cols = ModelerConfig.LAYOUT_DEFAULT_COLS;
            transition.dataGroups.push(dataGroup);
        }
        this.modelService.transition = this.modelService.graphicModel.transitions.find((item) => item.transition.id === id);
    }

    // Method is called when redirecting from bpmn edit mode to actions editor, using contextPad action on bpmn elem.
    openActions(id) {
        if(!this.modelService.model.getTransition(id)) {
            console.log('no transition wit this Id found', id)
            this.router.navigate(['/modeler']);
            return
        }
        this.transitionService.id = id
        this.router.navigate(['modeler/actions']);
    }

    ngOnDestroy(): void {
        this.bpmnJS.get('propertiesPanel').detach()
        this.bpmnJS.detach();
        this.bpmnJS = null
    }

    dragOverHandler(ev) {
        console.log('File(s) in drop zone');
        ev.stopPropagation();
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();

    }

    // Drag import BPMN file
    dropHandler(ev) {
        ev.stopPropagation();
        console.log('File(s) dropped');
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
        const file = ev.dataTransfer.files[0];
        const reader = new FileReader();
        reader.readAsText(file)
        reader.onloadend = () => {
        this.BpmnService.importXml(reader.result as string)
        }
    }
}
