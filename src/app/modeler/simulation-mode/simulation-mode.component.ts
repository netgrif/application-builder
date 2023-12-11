import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {SimulationModeService} from './simulation-mode.service';
import {PetriflowCanvasService} from '@netgrif/petriflow.svg';
import {ModelService} from '../services/model/model.service';

@Component({
    selector: 'nab-simulation-mode',
    templateUrl: './simulation-mode.component.html',
    styleUrls: ['./simulation-mode.component.scss']
})
export class SimulationModeComponent implements AfterViewInit, OnDestroy {
    @ViewChild('canvas') canvas: ElementRef;

    constructor(
        public canvasService: PetriflowCanvasService,
        private simulationService: SimulationModeService,
        private modelService: ModelService
    ) {
    }

    ngAfterViewInit() {
        this.simulationService.originalModel.next(this.modelService.model);
        this.simulationService.activate();
    }

    ngOnDestroy(): void {
        this.simulationService.activeTool.unbind();
    }
}
