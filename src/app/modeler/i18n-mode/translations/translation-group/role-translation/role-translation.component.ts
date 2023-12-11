import {Component, Input, OnInit} from '@angular/core';
import {I18nTranslations, PetriNet} from '@netgrif/petriflow';
import {ModelService} from '../../../../services/model/model.service';

@Component({
    selector: 'nab-role-translation',
    templateUrl: './role-translation.component.html',
    styleUrls: ['./role-translation.component.scss']
})
export class RoleTranslationComponent implements OnInit {

    constructor(
        private modelService: ModelService
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

    notLast(i: any) {
        return i !== this.model.getRoles().length - 1;
    }
}
