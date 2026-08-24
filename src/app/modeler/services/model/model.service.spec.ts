import {Injector} from '@angular/core';
import {PetriNet} from '@netgrif/petriflow';
import {ArcFactory} from '../../edit-mode/domain/arc-builders/arc-factory.service';
import {ModelService} from './model.service';

describe('ModelService', () => {
    let service: ModelService;

    beforeEach(() => {
        service = new ModelService({} as ArcFactory, {} as Injector);
    });

    it('emits the current model before replacing it', () => {
        const first = new PetriNet();
        const second = new PetriNet();
        const emitted: Array<PetriNet> = [];
        service.modelWillChange.subscribe(model => emitted.push(model));

        service.model = first;
        service.model = second;
        service.model = second;
        service.model = undefined;

        expect(emitted).toEqual([first, second]);
    });
});
