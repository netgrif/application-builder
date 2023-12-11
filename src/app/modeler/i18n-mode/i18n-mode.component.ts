import {Component, OnInit} from '@angular/core';
import {I18nModeService} from './i18n-mode.service';

@Component({
    selector: 'nab-i18n-mode',
    templateUrl: './i18n-mode.component.html',
    styleUrls: ['./i18n-mode.component.scss']
})
export class I18nModeComponent implements OnInit {

    constructor(private i18nService: I18nModeService) {
    }

    languagesSelected(): boolean {
        return this.i18nService.whichButton.getValue() === 'languages';
    }

    translationsSelected(): boolean {
        return this.i18nService.whichButton.getValue() === 'translations';
    }

    ngOnInit(): void {
    }
}
