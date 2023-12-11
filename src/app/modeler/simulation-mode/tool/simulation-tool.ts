import {SimulationModeService} from '../simulation-mode.service';
import {PetriflowCanvasService} from '@netgrif/petriflow.svg';
import {CanvasElementCollection} from '../../edit-mode/domain/canvas-element-collection';
import {BasicSimulation} from '@netgrif/petriflow';
import {CanvasListenerTool} from '../../services/canvas/canvas-listener-tool';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ModelService} from '../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {CanvasTransition} from '../../edit-mode/domain/canvas-transition';
import {CanvasPlace} from '../../edit-mode/domain/canvas-place';
import {CanvasArc} from '../../edit-mode/domain/canvas-arc';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../selected-transition.service';

export abstract class SimulationTool extends CanvasListenerTool {

    private readonly _simulationModeService: SimulationModeService;

    protected constructor(
        id: string,
        button: ControlPanelButton,
        modelService: ModelService,
        dialog: MatDialog,
        simulationModeService: SimulationModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(id, button, modelService, dialog, router, transitionService);
        this._simulationModeService = simulationModeService;
    }

    onContextMenu(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onTransitionContextMenu(event: MouseEvent, transition: CanvasTransition) {
        event.preventDefault();
    }

    onTransitionDoubleClick(event: MouseEvent, transition: CanvasTransition) {
    }

    onTransitionEnter(event: MouseEvent, transition: CanvasTransition): void {
    }

    onTransitionLeave(event: MouseEvent, transition: CanvasTransition) {
    }

    onPlaceContextMenu(event: MouseEvent, place: CanvasPlace) {
        event.preventDefault();
    }

    onPlaceDoubleClick(event: MouseEvent, place: CanvasPlace) {
    }

    onPlaceEnter(event: MouseEvent, place: CanvasPlace) {
    }

    onPlaceLeave(event: MouseEvent, place: CanvasPlace) {
    }

    onArcContextMenu(event: MouseEvent, arc: CanvasArc) {
        event.preventDefault();
    }

    onArcDoubleClick(event: MouseEvent, arc: CanvasArc) {
    }

    onArcEnter(event: MouseEvent, arc: CanvasArc) {
    }

    onArcLeave(event: MouseEvent, arc: CanvasArc) {
    }

    public reset(): void {
        this.simulation?.reset();
    }

    get canvasService(): PetriflowCanvasService {
        return this._simulationModeService.canvasService;
    }

    get elements(): CanvasElementCollection {
        return this._simulationModeService?.elements;
    }

    get simulationModeService(): SimulationModeService {
        return this._simulationModeService;
    }

    get simulation(): BasicSimulation {
        return this.simulationModeService.simulation;
    }
}
