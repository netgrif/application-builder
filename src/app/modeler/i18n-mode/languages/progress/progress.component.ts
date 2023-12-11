import {Component, Input, OnInit} from '@angular/core';
import {Locale} from '../../classes/locale';
import {I18nModeService} from '../../i18n-mode.service';

@Component({
    selector: 'nab-progress',
    templateUrl: './progress.component.html',
    styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {

    @Input()
    locale: Locale;

    constructor(private i18nService: I18nModeService) {
    }

    ngOnInit(): void {
    }

    removeLocale() {
        this.i18nService.removeLocale(this.locale.languageCode);
    }
}
