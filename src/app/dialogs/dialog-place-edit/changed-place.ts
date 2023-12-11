import {PetriNet, Place} from '@netgrif/petriflow';

export class ChangedPlace {

    public readonly id: string;
    public readonly place: Place;
    public readonly model: PetriNet;

    constructor(model: PetriNet, place?: Place, id = place?.id) {
        this.id = id;
        this.place = place;
        this.model = model;
    }
}
