import {Component} from '@angular/core';
import {I18nModeService} from '../../modeler/i18n-mode/i18n-mode.service';

@Component({
    selector: 'nab-dialog-add-language',
    templateUrl: './dialog-add-language.component.html',
    styleUrls: ['./dialog-add-language.component.scss']
})
export class DialogAddLanguageComponent {

    selectedLanguage: any;

    constructor(public i18nModeService: I18nModeService) {
    }
}
