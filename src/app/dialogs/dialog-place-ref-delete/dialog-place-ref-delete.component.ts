import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Place} from '../../modeler/classes/place/place';
import {Arc} from '@netgrif/petriflow';

export interface PlaceRefDeleteData {
    place: Place;
    arcs: Array<Arc>;
}

@Component({
    selector: 'nab-dialog-place-ref-delete',
    templateUrl: './dialog-place-ref-delete.component.html',
    styleUrls: ['./dialog-place-ref-delete.component.scss']
})
export class DialogPlaceRefDeleteComponent {

    constructor(@Inject(MAT_DIALOG_DATA) public data: PlaceRefDeleteData) {
    }

    public placeLabel(): string {
        return this.data.place.getLabelOrId();
    }

    public arcs(): string {
        return this.data.arcs.map(arc => arc.id).join(', ');
    }
}
