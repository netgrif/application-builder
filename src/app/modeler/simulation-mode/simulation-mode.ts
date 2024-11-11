import {Mode} from '../control-panel/modes/mode';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {TutorialStep} from '../../tutorial/tutorial-step';
import {Injector} from '@angular/core';

export class SimulationMode extends Mode {

    constructor(
        tutorialStep: TutorialStep,
        injector: Injector
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
}
