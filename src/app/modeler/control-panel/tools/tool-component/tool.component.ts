import {Component, Inject, OnInit} from '@angular/core';
import {Tool} from '../tool';
import {ModeService} from '../../modes/mode-component/mode.service';
import {NAB_CONTROL_PANEL_MODE, NAB_CONTROL_PANEL_TOOL} from '../../control-panel-tool-injection-token';
import {TutorialService} from '../../../../tutorial/tutorial-service';

@Component({
    selector: 'nab-tool',
    templateUrl: './tool.component.html',
    styleUrls: ['./tool.component.scss']
})
export class ToolComponent {

    constructor(
        @Inject(NAB_CONTROL_PANEL_TOOL) public tool: Tool,
        @Inject(NAB_CONTROL_PANEL_MODE) public modeService: ModeService<Tool>,
        public tutorialService: TutorialService
    ) {
    }

    isActive() {
        if (!this.modeService) {
            return false;
        }
        return this.modeService.isActive(this.tool);
    }

    activate() {
        if (!this.modeService) {
            return;
        }
        this.modeService.activate(this.tool);
    }

    isOutlined() {
        return this.tool.icon.isOutlined;
    }
}
