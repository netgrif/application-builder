import {Component, Input, OnInit} from '@angular/core';
import {I18nString, I18nTranslations} from '@netgrif/petriflow';
import {MaterialModule} from '@netgrif/components-core';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'nab-i18n-field',
    templateUrl: './i18n-field.component.html',
    styleUrls: ['./i18n-field.component.scss'],
    standalone: true,
    imports: [MaterialModule, CommonModule]
})
export class I18nFieldComponent implements OnInit {

    private _name: string;
    private _field: I18nString;
    private _translationField: I18nString;
    private _translation: I18nTranslations;

    constructor() {
    }

    ngOnInit(): void {
        this.updateTranslationField();
    }

    updateTranslationField() {
        this._translationField = this.translation?.getI18n(this._field?.name);
    }

    get translation(): I18nTranslations {
        return this._translation;
    }

    @Input()
    set translation(value: I18nTranslations) {
        this._translation = value;
        this.updateTranslationField();
    }

    get translationField(): I18nString {
        return this._translationField;
    }

    get name(): string {
        return this._name;
    }

    @Input()
    set name(value: string) {
        this._name = value;
    }

    get field(): I18nString {
        return this._field;
    }

    @Input()
    set field(value: I18nString) {
        this._field = value;
    }
}
