import {ElementChange} from '../element-change';
import {PetriNet} from '@netgrif/petriflow';

export class ModelChange extends ElementChange<PetriNet> {

    constructor(
        originalElement: PetriNet,
        element: PetriNet,
        message: string = `Model ${element.id} has been changed`
    ) {
        super(originalElement, element, element, message);
    }
}
