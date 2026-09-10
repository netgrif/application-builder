import {Injectable, Injector} from '@angular/core';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {Mode} from '../control-panel/modes/mode';
import {ModeService} from '../control-panel/modes/mode-component/mode.service';
import {Tool} from '../control-panel/tools/tool';
import {TutorialService} from '../../tutorial/tutorial-service';

@Injectable({
    providedIn: 'root',
})
export class XmlModeService extends ModeService<Tool> {
    static readonly URL = 'xml';

    constructor(
        private tutorialService: TutorialService,
        private parentInjector: Injector,
    ) {
        super();
        this.mode = new Mode(
            XmlModeService.URL,
            new ControlPanelButton(
                new ControlPanelIcon('data_object'),
                'Process XML',
            ),
            `./${XmlModeService.URL}`,
            `/modeler/${XmlModeService.URL}`,
            this.tutorialService.xml,
            this.parentInjector,
        );
        this.tools = [];
    }
}
