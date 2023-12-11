import {Component, Input, OnInit} from '@angular/core';
import {ModelService} from '../../../../services/model.service';
import {I18nTranslations, PetriNet} from '@netgrif/petriflow';
import {Locale} from '../../../classes/locale';

@Component({
    selector: 'nab-model-translation',
    templateUrl: './model-translation.component.html',
    styleUrls: ['./model-translation.component.scss']
})
export class ModelTranslationComponent implements OnInit {

    constructor(
        private modelService: ModelService,
    ) {
    }

    get model(): PetriNet {
        return this.modelService.model;
    }

    get translation(): I18nTranslations {
        return this._translation;
    }

    @Input()
    set translation(value: I18nTranslations) {
        this._translation = value;
    }

    private _translation: I18nTranslations;

    ngOnInit(): void {
    }
}
