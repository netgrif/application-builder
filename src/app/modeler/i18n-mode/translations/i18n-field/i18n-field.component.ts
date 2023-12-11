import {Component, Input, OnInit} from '@angular/core';
import {I18nString, I18nTranslations} from '@netgrif/petriflow';

@Component({
  selector: 'nab-i18n-field',
  templateUrl: './i18n-field.component.html',
  styleUrls: ['./i18n-field.component.scss'],
})
export class I18nFieldComponent implements OnInit {

  constructor() {
  }

  private _name: string;

  get name(): string {
    return this._name;
  }

  @Input()
  set name(value: string) {
    this._name = value;
  }

  private _field: I18nString;

  get field(): I18nString {
    return this._field;
  }

  @Input()
  set field(value: I18nString) {
    this._field = value;
  }

  private _translationField: I18nString;

  get translationField(): I18nString {
    return this._translationField;
  }

  private _translation: I18nTranslations;

  get translation(): I18nTranslations {
    return this._translation;
  }

  @Input()
  set translation(value: I18nTranslations) {
    this._translation = value;
    this.updateTranslationField();
  }

  ngOnInit(): void {
    this.updateTranslationField();
  }

  updateTranslationField() {
    this._translationField = this.translation?.getI18n(this._field?.name);
  }
}
