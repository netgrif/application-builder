import {Component, Inject} from '@angular/core';
import {ModelService} from '../../modeler/services/model/model.service';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ChangedPlace} from './changed-place';
import {FormControl, ValidatorFn, Validators} from '@angular/forms';
import {PlaceChangeType} from './place-change-type';

export interface PlaceEditData {
    placeId: string;
}

@Component({
    selector: 'nab-dialog-place-edit',
    templateUrl: './dialog-place-edit.component.html',
    styleUrls: ['./dialog-place-edit.component.scss']
})
export class DialogPlaceEditComponent {

    public place: ChangedPlace;
    public idCtrl: FormControl;
    public markingCtrl: FormControl;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: PlaceEditData,
        public modelService: ModelService
    ) {
        this.place = new ChangedPlace(PlaceChangeType.EDIT, undefined, this.modelService.model.getPlace(data.placeId).clone());
        this.idCtrl = new FormControl('', [
            Validators.required,
            this.validUnique()
        ]);
        this.markingCtrl = new FormControl('', [
            Validators.required,
            this.validMarking()
        ]);
    }

    private validUnique(): ValidatorFn {
        return (fc: FormControl): { [key: string]: any } | null => {
            if (this.modelService.model.getPlace(fc.value) !== undefined && fc.value !== this.place.id) {
                return ({validUnique: true});
            } else {
                return null;
            }
        };
    }

    private validMarking(): ValidatorFn {
        return (fc: FormControl): { [key: string]: any } | null => {
            const marking = Math.floor(fc.value as number);
            if (marking !== Infinity && marking === fc.value as number && marking >= 0) {
                return null;
            }
            return ({validMarking: true})
        };
    }
}
