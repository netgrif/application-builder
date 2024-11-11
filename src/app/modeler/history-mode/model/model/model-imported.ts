import {ModelChange} from './model-change';
import {PetriNet} from '@netgrif/petriflow';

export class ModelImported extends ModelChange {

    constructor(model: PetriNet) {
        super(undefined, model, `Model ${model.id} has been imported`);
    }
}
