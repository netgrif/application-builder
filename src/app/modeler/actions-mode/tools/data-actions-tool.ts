import {Tool} from '../../control-panel/tools/tool';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../control-panel/control-panel-icon';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DataActionsTool extends Tool {

    public static ID = 'data';

    constructor() {
        super(
            DataActionsTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('all_inbox', false, true),
                'Data Variables'
            )
        );
    }

    public onClick(): void {
    }
}
