import {Mode} from '../control-panel/modes/mode';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {TutorialStep} from '../../tutorial/tutorial-step';
import {Injector} from '@angular/core';
import {SimulationModeService} from './simulation-mode.service';
import {ModelSourceService} from '../services/model/model-source.service';

export class SimulationMode extends Mode {

    constructor(
        tutorialStep: TutorialStep,
        injector: Injector,
        private simulationService: SimulationModeService,
        private modelSource: ModelSourceService
    ) {
        super(
            'simulation',
            new ControlPanelButton(
                new ControlPanelIcon('play_circle'),
                'Simulation view'
            ),
            './simulation',
            '/modeler/simulation',
            tutorialStep,
            injector
        );
    }

    activate() {
        super.activate();
        this.modelSource.source = this.simulationService;
    }

    deactivate() {
        super.deactivate();
        this.modelSource.source = this.simulationService.modelService;
    }
}
