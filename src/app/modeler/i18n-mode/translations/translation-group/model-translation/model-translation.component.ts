import {Component, Input} from '@angular/core';
import {I18nTranslations, PetriNet} from '@netgrif/petriflow';
import {ModelService} from '../../../../services/model.service';

@Component({
  selector: 'nab-model-translation',
  templateUrl: './model-translation.component.html',
  styleUrls: ['./model-translation.component.scss'],
})
export class ModelTranslationComponent {

  constructor(
    private modelService: ModelService,
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

}
