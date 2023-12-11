import {Injectable} from '@angular/core';
import {Locale} from './classes/locale';
import {BehaviorSubject} from 'rxjs';
import {ModelService} from '../services/model.service';
import {I18nString, I18nTranslations} from '@netgrif/petriflow';
import {I18nStringKeyTemplate} from './translations/i18n-string-key-template';
import {Locales} from './classes/locales';

@Injectable({
    providedIn: 'root'
})
export class I18nModeService {

    whichButton: BehaviorSubject<string>;

    constructor(
        private modelService: ModelService
    ) {
        this.whichButton = new BehaviorSubject('languages');
    }

    get locales(): Array<Locale> {
        return this.modelService.model.getI18ns().map(i18n => {
            let locale = Locales.list.find(l => l.languageCode === i18n.locale);
            if (!locale) {
                locale = new Locale(i18n.locale, i18n.locale, i18n.locale, i18n.locale, i18n.locale);
            }
            return locale;
        });
    }

    addLocale(locale: string) {
        const translation = new I18nTranslations(locale);
        this.updateI18n([translation]);
        this.modelService.model.addI18n(translation);
    }

    removeLocale(locale: string) {
        this.modelService.model.removeI18n(locale);
    }

    updateI18ns(): void {
        const model = this.modelService.model;
        const translations = model.getI18ns();
        this.updateI18n(translations);
    }

    updateI18n(translations: Array<I18nTranslations>): void {
        const model = this.modelService.model;
        // Model
        this.checkI18n(model.title, I18nStringKeyTemplate.model.title(), translations);
        this.checkI18n(model.caseName, I18nStringKeyTemplate.model.defaultCaseName(), translations);
        // Task
        model.getTransitions().forEach(task => {
            this.checkI18n(task.label, I18nStringKeyTemplate.task.title(task.id), translations);
            task.getEvents().forEach(event => {
                this.checkI18n(event.message, I18nStringKeyTemplate.task.event.message(task.id, event.id), translations);
                this.checkI18n(event.title, I18nStringKeyTemplate.task.event.title(task.id, event.id), translations);
            });
        });
        // Data
        model.getDataSet().forEach(data => {
            this.checkI18n(data.title, I18nStringKeyTemplate.data.title(data.id), translations);
            this.checkI18n(data.placeholder, I18nStringKeyTemplate.data.placeholder(data.id), translations);
            this.checkI18n(data.desc, I18nStringKeyTemplate.data.description(data.id), translations);
            data.options?.forEach(option => {
                this.checkI18n(option.value, I18nStringKeyTemplate.data.option(data.id, option.key), translations);
            });
            data.validations?.forEach(validation => {
                this.checkI18n(validation.message, I18nStringKeyTemplate.data.validation(data.id, Date.now()), translations);
            });
        });
        // Role
        model.getRoles().forEach(role => {
            this.checkI18n(role.title, I18nStringKeyTemplate.role.title(role.id), translations);
            role.getEvents().forEach(event => {
                this.checkI18n(event.message, I18nStringKeyTemplate.role.event.message(role.id, event.id), translations);
                this.checkI18n(event.title, I18nStringKeyTemplate.role.event.title(role.id, event.id), translations);
            });
        });
    }

    private checkI18n(i18n: I18nString, key: string, translations: Array<I18nTranslations>): void {
        if (!i18n?.name) {
            i18n.name = key;
        }
        translations.forEach(t => {
            if (!t.getI18n(i18n.name)) {
                t.addI18n(new I18nString('', i18n.name));
            }
        });
    }
}
