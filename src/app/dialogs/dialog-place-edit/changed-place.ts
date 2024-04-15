import {PetriNet, Place} from '@netgrif/petriflow';
import {PlaceChangeType} from './place-change-type';

export class ChangedPlace {

    public readonly id: string;
    public readonly place: Place;
    public readonly model: PetriNet;
    public readonly type: PlaceChangeType;

    constructor(type: PlaceChangeType,model: PetriNet, place?: Place, id = place?.id) {
        this.type = type;
        this.id = id;
        this.place = place;
        this.model = model;
    }
}
