import {Component, Input} from '@angular/core';
import {DataVariable, I18nTranslations, PetriNet} from '@netgrif/petriflow';
import {ModelService} from '../../../../services/model.service';
import {I18nModeService} from '../../../i18n-mode.service';

@Component({
  selector: 'nab-data-translation',
  templateUrl: './data-translation.component.html',
  styleUrls: ['./data-translation.component.scss'],
})
export class DataTranslationComponent {

  constructor(
    private modelService: ModelService,
    private i18nModeService: I18nModeService,
  ) {
  }

  get model(): PetriNet {
    return this.modelService.model;
  }

  private _translation: I18nTranslations;

  get translation(): I18nTranslations {
    return this._translation;
  }

  @Input()
  set translation(value: I18nTranslations) {
    this._translation = value;
  }

  notLast(i: any) {
    return i !== this.model.getDataSet().length - 1;
  }

  isI18nField(dataVariable: DataVariable): boolean {
    return this.i18nModeService.isI18nField(dataVariable);
  }
}
