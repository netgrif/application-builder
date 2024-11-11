import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../control-panel/control-panel-icon';
import {Injectable} from '@angular/core';
import {ComponentPortal} from '@angular/cdk/portal';
import {I18nTool} from '../classes/i18n-tool';
import {TranslationsComponent} from './translations.component';

@Injectable({
    providedIn: 'root'
})
export class TranslationsTool extends I18nTool {

    constructor() {
        super(
            'translations',
            new ComponentPortal(TranslationsComponent),
            new ControlPanelButton(
                new ControlPanelIcon('translate'),
                'Translations'
            )
        );
    }
}
