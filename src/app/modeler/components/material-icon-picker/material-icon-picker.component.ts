import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MaterialIconList} from './material-icon-list';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {FormControl} from '@angular/forms';

@Component({
    selector: 'nab-material-icon-picker',
    templateUrl: './material-icon-picker.component.html',
    styleUrls: ['./material-icon-picker.component.scss']
})
export class MaterialIconPickerComponent implements OnInit {

    formControlRef: FormControl;
    public icons = MaterialIconList.icons;
    public filteredIcons: Observable<Array<string>>;
    @Input() icon: string;
    @Output() iconChange: EventEmitter<string> = new EventEmitter<string>();

    constructor() {
        this.formControlRef = new FormControl('');
    }

    ngOnInit(): void {
        this.filteredIcons = this.formControlRef.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value || '')),
            map(value => {
                if (value.length > 20) {
                    return value.slice(0, 20)
                }
                return value;
            })
        );
    }

    private _filter(value: string): Array<string> {
        const filterValue = value.toLowerCase();
        if (value === '') {
            return new Array<string>();
        }
        const startsWith = new Array<string>();
        const includes = new Array<string>();
        this.icons.forEach(icon => {
            if (icon.includes(filterValue)) {
                if (icon.startsWith(filterValue)) {
                    startsWith.push(icon);
                } else {
                    includes.push(icon);
                }
            }
        });
        return startsWith.concat(includes);
    }

    updateIcon() {
        this.iconChange.next(this.icon);
    }
}
