import {PlaceChange} from './place-change';
import {PetriNet, Place} from '@netgrif/petriflow';

export class PlaceDeleted extends PlaceChange {

    constructor(place: Place, model: PetriNet) {
        super(place, undefined, model, `Place ${place.id} has been deleted`);
    }
}
