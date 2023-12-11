import {Tool} from '../control-panel/tools/tool';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ProcessActionsTool extends Tool {

    public static ID = 'process';

    constructor() {
        super(
            ProcessActionsTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('device_hub'),
                'Process & Case'
            )
        );
    }

    public onClick(): void {
    }
}
