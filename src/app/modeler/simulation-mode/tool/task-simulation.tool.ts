import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../control-panel/control-panel-icon';
import {SimulationTool} from './simulation-tool';
import {ModelService} from '../../services/model/model.service';
import {SimulationModeService} from '../simulation-mode.service';
import {CanvasTransition} from '../../edit-mode/domain/canvas-transition';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../selected-transition.service';

export class TaskSimulationTool extends SimulationTool {

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        simulationModeService: SimulationModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            'simulation',
            new ControlPanelButton(
                new ControlPanelIcon('play_arrow', false, true),
                'Simulation by Tasks'
            ),
            modelService,
            dialog,
            simulationModeService,
            router,
            transitionService
        );
    }

    bind(): void {
        super.bind();
        this.simulationModeService.onTransitionDraw = (t: CanvasTransition) => {
            if (this.simulation.isEnabled(t.id)) {
                t.svgTransition.enable(false);
            } else {
                t.svgTransition.disable(false);
            }
        };
        this.simulationModeService.renderModel(this.simulation.simulationModel);
    }

    onTransitionClick(event: MouseEvent, transition: CanvasTransition) {
        super.onTransitionClick(event, transition);
        if (this.simulation.isEnabled(transition.id)) {
            this.simulation.fire(transition.id);
        }
        this.simulationModeService.renderModel(this.simulation.simulationModel);
    }
}
