import {Component, OnInit} from '@angular/core';
import {I18nModeService} from './i18n-mode.service';
import {ComponentPortal} from '@angular/cdk/portal';
import {I18nTool} from './classes/i18n-tool';

@Component({
    selector: 'nab-i18n-mode',
    templateUrl: './i18n-mode.component.html',
    styleUrls: ['./i18n-mode.component.scss']
})
export class I18nModeComponent implements OnInit {

    selectedToolPortal: ComponentPortal<any>;

    constructor(
        private i18nService: I18nModeService
    ) {
    }

    ngOnInit(): void {
        this.i18nService.activeToolSubject.subscribe((selected: I18nTool) => {
            this.selectedToolPortal = selected.portal;
        });
    }
}
