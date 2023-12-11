import {MatDialog} from '@angular/material/dialog';
import { SimulationTool } from './simulation-tool';
import {ModelService} from '../../services/model/model.service';
import {SimulationModeService} from '../simulation-mode.service';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../control-panel/control-panel-icon';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../selected-transition.service';

export class ResetPositionAndZoomTool extends SimulationTool {

    public static readonly ID = 'ResetPositionAndZoomTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        simulationModeService: SimulationModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            ResetPositionAndZoomTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('fit_screen', false, true),
                'Reset canvas position and zoom',
            ),
            modelService,
            dialog,
            simulationModeService,
            router,
            transitionService
        );
    }

    onClick(): void {
        this.canvasService.panzoom?.reset();
    }
}
