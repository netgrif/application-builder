import {Component, Input} from '@angular/core';
import {I18nTranslations, PetriNet} from '@netgrif/petriflow';
import {ModelService} from '../../../../services/model.service';

@Component({
  selector: 'nab-task-translation',
  templateUrl: './task-translation.component.html',
  styleUrls: ['./task-translation.component.scss'],
})
export class TaskTranslationComponent {

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

  notLast(i: number) {
    return i !== this.model.getTransitions().length - 1;
  }
}
