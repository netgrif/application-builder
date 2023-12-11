import {Tool} from '../control-panel/tools/tool';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class RoleActionsTool extends Tool {

    public static ID = 'role';

    constructor() {
        super(
            RoleActionsTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('person', false, true),
                'Roles'
            )
        );
    }

    public onClick(): void {
    }
}
