import {Tool} from '../../control-panel/tools/tool';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../control-panel/control-panel-icon';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FunctionsTool extends Tool {

    public static ID = 'functions';

    constructor() {
        super(
            FunctionsTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('functions'),
                'Functions'
            )
        );
    }

    public onClick(): void {
    }
}
