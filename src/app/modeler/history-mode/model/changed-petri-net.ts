import {PetriNet} from '@netgrif/petriflow';

export class ChangedPetriNet {
    private _id: string;
    private _model: PetriNet;

    constructor(id: string, model: PetriNet) {
        this._id = id;
        this._model = model;
    }

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get model(): PetriNet {
        return this._model;
    }

    set model(value: PetriNet) {
        this._model = value;
    }
}
