import {Injectable, Injector} from '@angular/core';
import {TutorialService} from '../../tutorial/tutorial-service';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {Mode} from '../control-panel/modes/mode';
import {ModeService} from '../control-panel/modes/mode-component/mode.service';
import {Tool} from '../control-panel/tools/tool';

@Injectable({
    providedIn: 'root'
})
export class BpmnModeService extends ModeService<Tool> {

    static readonly ID = 'bpmn';

    constructor(
        private _tutorialService: TutorialService,
        private _parentInjector: Injector,
    ) {
        super();
        this.mode = new Mode(
            BpmnModeService.ID,
            new ControlPanelButton(
                new ControlPanelIcon('schema'),
                'BPMN Editor'
            ),
            './bpmn',
            '/modeler/bpmn',
            this._tutorialService.bpmn,
            this._parentInjector
        );
        this.tools = [];
    }
}
