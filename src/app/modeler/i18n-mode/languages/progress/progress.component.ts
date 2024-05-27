import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Locale} from '../../classes/locale';
import {I18nModeService} from '../../i18n-mode.service';

@Component({
    selector: 'nab-progress',
    templateUrl: './progress.component.html',
    styleUrls: ['./progress.component.scss']
})
export class ProgressComponent {

    @Input() locale: Locale;
    @Output() deleteLocale = new EventEmitter<Locale>();

    constructor(private i18nService: I18nModeService) {
    }

    removeLocale() {
        this.i18nService.removeLocale(this.locale.languageCode);
        this.deleteLocale.emit(this.locale);
    }
}
