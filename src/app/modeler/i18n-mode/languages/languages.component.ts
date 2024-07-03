import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Locale} from '../classes/locale';
import {Locales} from '../classes/locales';
import {I18nModeService} from '../i18n-mode.service';
import {MatSelect} from '@angular/material/select';
import {AbstractControl, FormControl, ValidatorFn, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {HistoryService} from '../../services/history/history.service';
import {LanguageSelectService} from './language-select.service';

@Component({
    selector: 'nab-languages',
    templateUrl: './languages.component.html',
    styleUrls: ['./languages.component.scss']
})
export class LanguagesComponent implements OnInit, OnDestroy {

    historySave: boolean;
    newLocaleFormControl = new FormControl<Locale>(undefined, {
        validators: [this.autocompleteStringValidator(), Validators.required]
    });
    filteredLocales: Observable<Array<Locale>>;

    constructor(protected i18nService: I18nModeService,
                protected _historyService: HistoryService,
                protected _languageSelect: LanguageSelectService) {
    }

    ngOnInit(): void {
        this.filteredLocales = this.newLocaleFormControl.valueChanges.pipe(
            startWith(''),
            map(name => this._filter(name)),
        );
    }

    ngOnDestroy() {
        if (this.historySave) {
            this._historyService.save("Translations has been changed.");
        }
    }

    invalidLocale(): boolean {
        return this.newLocaleFormControl.invalid;
    }

    displayFn(locale: Locale): string {
        return locale ? locale.prettyName : '';
    }

    private _filter(name: any): Array<Locale> {
        if (!name) {
            return this.unusedLocales();
        }
        if (name instanceof Locale) {
            return [name];
        }
        return this.unusedLocales().filter(option => option.prettyName.toLowerCase().includes(name.toLowerCase()));
    }

    autocompleteStringValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            if (this.unusedLocales().indexOf(control.value) !== -1) {
                return null;
            }
            return {invalidAutocompleteString: {value: control.value}};
        };
    }

    unusedLocales(): Array<Locale> {
        return Locales.list.filter(l => !this.i18nService?.locales?.includes(l));
    }

    usedLocales(): Array<Locale> {
        return this.i18nService?.locales;
    }

    addLocal() {
        this.i18nService.addLocale(this.newLocaleFormControl.value.languageCode);
        this.newLocaleFormControl.reset();
        this.historySave = true;
    }

    deleteLocale() {
        this.historySave = true;
    }

    selectLocale(locale) {
        this._languageSelect.locale = locale;
        this.i18nService.activate(this.i18nService.translationsTool);
    }
}
