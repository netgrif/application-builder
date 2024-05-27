import {Component, OnDestroy, OnInit} from '@angular/core';
import {Locale} from '../classes/locale';
import {I18nModeService} from '../i18n-mode.service';
import {TranslationGroupConfiguration, Type} from './translation-group/translation-group-configuration';
import {I18nTranslations} from '@netgrif/petriflow';
import {ModelService} from '../../services/model/model.service';
import {HistoryService} from '../../services/history/history.service';

@Component({
    selector: 'nab-translations',
    templateUrl: './translations.component.html',
    styleUrls: ['./translations.component.scss']
})
export class TranslationsComponent implements OnInit, OnDestroy {

    locale: Locale;
    modelMetadataConfig: TranslationGroupConfiguration;
    taskMetadataConfig: TranslationGroupConfiguration;
    dataMetadataConfig: TranslationGroupConfiguration;
    roleMetadataConfig: TranslationGroupConfiguration;
    private _translation: I18nTranslations;

    constructor(
        private i18nService: I18nModeService,
        private modelService: ModelService,
        private historyService: HistoryService
    ) {
    }

    ngOnInit(): void {
        this.modelMetadataConfig = new TranslationGroupConfiguration(
            Type.MODEL,
            'device_hub',
            'Model metadata',
            'Title, default case name, ...',
            () => false,
            ''
        );
        this.taskMetadataConfig = new TranslationGroupConfiguration(
            Type.TASK,
            'auto_awesome_motion',
            'Tasks',
            'Label, event messages, ...',
            () => this.modelService.model.getTransitions().length === 0,
            'There are no tasks in the model'
        );
        this.dataMetadataConfig = new TranslationGroupConfiguration(
            Type.DATA,
            'all_inbox',
            'Data variables',
            'Title, placeholder, description, ...',
            () => this.modelService.model.getDataSet().length === 0,
            'There are no data variables in the model'
        );
        this.roleMetadataConfig = new TranslationGroupConfiguration(
            Type.ROLE,
            'person',
            'Roles',
            'Name, event message, ...',
            () => this.modelService.model.getRoles().length === 0,
            'There are no roles in the model'
        );
    }

    ngOnDestroy() {
        if (this.i18nService.translationsSave) {
            this.i18nService.translationsSave = false;
            this.historyService.save("Translations has been changed.")
        }
    }

    usedLocales(): Array<Locale> {
        return this.i18nService.locales;
    }

    noLocales(): boolean {
        return this.i18nService.locales.length === 0;
    }

    selectLocale() {
        this._translation = this.modelService.model.getI18n(this.locale?.languageCode);
    }

    get translation(): I18nTranslations {
        return this._translation;
    }

    set translation(value: I18nTranslations) {
        this._translation = value;
    }
}
