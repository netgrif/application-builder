import {Component, Input, OnInit} from '@angular/core';
import {CanvasService} from '../services/canvas.service';
import {ModelService} from '../services/model.service';
import {MatSidenav} from '@angular/material/sidenav';
import {PetriNet, Transition, Trigger} from '@netgrif/petriflow';

export interface Select {
    key: string;
    value: string;
}

@Component({
    selector: 'nab-edit-panel-modeler',
    templateUrl: './edit-panel-modeler.component.html',
    styleUrls: ['./edit-panel-modeler.component.scss']
})
export class EditPanelModelerComponent implements OnInit {
    @Input() nav: MatSidenav;
    optionsAssign: Array<Select>;
    optionsFinish: Array<Select>;
    transition: Transition;
    model: PetriNet;

    constructor(private canvasService: CanvasService, private modelService: ModelService) {
        this.optionsAssign = [{key: 'manual', value: 'Manual'}, {key: 'auto', value: 'Auto'}];
        this.optionsFinish = [{key: 'manual', value: 'Manual'}, {key: 'auto_no_data', value: 'Auto no data'}];
    }

    ngOnInit(): void {
        this.canvasService.selectedTransition.subscribe(obj => this.transition = obj?.transition);
        this.canvasService.model.subscribe(model => this.model = model);
    }

    onChange($event, value: string) {
        switch (value) {
            case 'label':
                this.modelService.model.getTransition(this.transition.id).label.value = $event.target.value;
                this.canvasService.renderModel(this.modelService.model);
                break;
            case 'icon':
                this.modelService.model.getTransition(this.transition.id).icon = $event.target.value;
                this.canvasService.renderModel(this.modelService.model);
                break;
            case 'assign':
                this.modelService.model.getTransition(this.transition.id).assignPolicy = $event.target.value;
                break;
            case 'finish':
                this.modelService.model.getTransition(this.transition.id).finishPolicy = $event.target.value;
                break;
        }
    }

    saveTriggers(triggers: Array<Trigger>) {
        this.transition.triggers = [...triggers];
    }

    getTransitionLabel(): string {
        return this.transition.label?.value ?? '';
    }
}
