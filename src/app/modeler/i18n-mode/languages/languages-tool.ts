import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../control-panel/control-panel-icon';
import {I18nTool} from '../classes/i18n-tool';
import {ComponentPortal} from '@angular/cdk/portal';
import {LanguagesComponent} from './languages.component';

@Injectable({
    providedIn: 'root'
})
export class LanguagesTool extends I18nTool {

    constructor() {
        super(
            'languages',
            new ComponentPortal(LanguagesComponent),
            new ControlPanelButton(
                new ControlPanelIcon('language'),
                'Languages'
            ),
        );
    }

    onClick(): void {

    }
}
