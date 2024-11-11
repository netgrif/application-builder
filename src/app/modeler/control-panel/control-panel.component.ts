import {AfterViewInit, Component} from '@angular/core';
import {ControlPanelService} from './control-panel.service';
import {GlobalToolRegistry} from './tools/global-tool-registry';

@Component({
    selector: 'nab-control-panel',
    templateUrl: './control-panel.component.html',
    styleUrls: ['./control-panel.component.scss']
})
export class ControlPanelComponent {

    constructor(
        public globalToolRegistry: GlobalToolRegistry,
        public controlPanelService: ControlPanelService,
    ) {
    }
}
