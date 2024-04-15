import {Injectable, Injector} from '@angular/core';
import {ModeService} from '../control-panel/modes/mode-component/mode.service';
import {Tool} from '../control-panel/tools/tool';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {TutorialService} from '../../tutorial/tutorial-service';
import {Mode} from '../control-panel/modes/mode';

@Injectable({
    providedIn: 'root'
})
export class HistoryModeService extends ModeService<Tool> {

    constructor(
        private _tutorialService: TutorialService,
        private _parentInjector: Injector
    ) {
        super();
        this.mode = new Mode(
            'history',
            new ControlPanelButton(
                new ControlPanelIcon('history'),
                'History'
            ),
            './history',
            '/modeler/history',
            this._tutorialService.dataEditor,
            this._parentInjector
        );
        this.tools = [];
    }
}
