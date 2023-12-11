import {Component, Input} from '@angular/core';
import {Locale} from '../../classes/locale';

@Component({
    selector: 'nab-flag',
    templateUrl: './flag.component.html',
    styleUrls: ['./flag.component.scss']
})
export class FlagComponent {

    private _locale: Locale;

    get code(): string {
        return this._locale.countryCode.toLowerCase();
    }

    get name(): string {
        return this._locale.country;
    }

    @Input()
    set locale(value: Locale) {
        this._locale = value;
    }
}
