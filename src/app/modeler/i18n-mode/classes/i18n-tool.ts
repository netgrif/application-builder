import {Tool} from '../../control-panel/tools/tool';
import {ComponentPortal} from '@angular/cdk/portal';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {Type} from '@angular/core';

export abstract class I18nTool extends Tool {

    private readonly _portal: ComponentPortal<any>;

    protected constructor(id: string, portal: ComponentPortal<any>, button: ControlPanelButton, component?: Type<any>) {
        super(id, button, component);
        this._portal = portal;
    }

    get portal(): ComponentPortal<any> {
        return this._portal;
    }

    onClick() {
    }
}
