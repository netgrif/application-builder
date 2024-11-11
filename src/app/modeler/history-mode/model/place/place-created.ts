import {PlaceChange} from './place-change';
import {PetriNet, Place} from '@netgrif/petriflow';

export class PlaceCreated extends PlaceChange {

    constructor(place: Place, model: PetriNet) {
        super(undefined, place, model, `New place ${place.id} has been created`);
    }
}
