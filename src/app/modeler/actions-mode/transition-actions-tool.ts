import {Tool} from '../control-panel/tools/tool';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TransitionActionsTool extends Tool {

    public static ID = 'transition';

    constructor() {
        super(
            TransitionActionsTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('auto_awesome_motion', false, true),
                'Transitions'
            )
        );
    }

    public onClick(): void {
    }
}
