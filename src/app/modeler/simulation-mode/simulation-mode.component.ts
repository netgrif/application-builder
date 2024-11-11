import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {SimulationModeService} from './simulation-mode.service';
import {PetriflowCanvasService} from '@netgrif/petriflow.svg';
import {ModelService} from '../services/model/model.service';
import {ModelerUtils} from '../modeler-utils';

@Component({
    selector: 'nab-simulation-mode',
    templateUrl: './simulation-mode.component.html',
    styleUrls: ['./simulation-mode.component.scss']
})
export class SimulationModeComponent implements AfterViewInit, OnDestroy {
    public static readonly URL = 'simulation';
    @ViewChild('canvas') canvas: ElementRef;

    constructor(
        public canvasService: PetriflowCanvasService,
        private simulationService: SimulationModeService,
        private modelService: ModelService
    ) {
    }

    ngAfterViewInit() {
        ModelerUtils.clearSelection();
        this.simulationService.originalModel.next(this.modelService.model);
        this.simulationService.activate();
    }

    ngOnDestroy(): void {
        this.simulationService.activeTool.unbind();
    }
}
