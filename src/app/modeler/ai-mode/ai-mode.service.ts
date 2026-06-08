import {Injectable, Injector} from '@angular/core';
import {ModeService} from '../control-panel/modes/mode-component/mode.service';
import {Tool} from '../control-panel/tools/tool';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {TutorialService} from '../../tutorial/tutorial-service';
import {Mode} from '../control-panel/modes/mode';

/**
 * Registers the AI Assistant as a first-class mode alongside Edit / Simulation /
 * Data / Roles / Actions / I18n / History. Selecting the icon in the control
 * panel routes to /modeler/ai instead of opening an overlay drawer.
 */
@Injectable({
    providedIn: 'root'
})
export class AiModeService extends ModeService<Tool> {

    constructor(
        private _tutorialService: TutorialService,
        private _parentInjector: Injector
    ) {
        super();
        this.mode = new Mode(
            'ai',
            new ControlPanelButton(
                new ControlPanelIcon('auto_awesome', false, true),
                'AI Assistant'
            ),
            './ai',
            '/modeler/ai',
            this._tutorialService.aiAssistant,
            this._parentInjector
        );
        this.tools = [];
    }
}
