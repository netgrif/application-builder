import {Component, Input} from '@angular/core';
import {I18nTranslations} from '@netgrif/petriflow';
import {TranslationGroupConfiguration, Type} from './translation-group-configuration';

@Component({
  selector: 'nab-translation-group',
  templateUrl: './translation-group.component.html',
  styleUrls: ['./translation-group.component.scss'],
})
export class TranslationGroupComponent {

  @Input()
  config: TranslationGroupConfiguration;

  constructor() {
  }

  private _translation: I18nTranslations;

  get translation(): I18nTranslations {
    return this._translation;
  }

  @Input()
  set translation(value: I18nTranslations) {
    this._translation = value;
  }

  isModel(): boolean {
    return this.config.type === Type.MODEL;
  }

  isTask(): boolean {
    return this.config.type === Type.TASK;
  }

  isData(): boolean {
    return this.config.type === Type.DATA;
  }

  isRole(): boolean {
    return this.config.type === Type.ROLE;
  }
}
