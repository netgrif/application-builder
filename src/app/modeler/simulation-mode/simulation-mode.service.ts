import {Injectable} from '@angular/core';
import {ModelService} from '../services/model.service';
import {BehaviorSubject} from 'rxjs';
import {PetriNet} from '@netgrif/petriflow';

@Injectable({
    providedIn: 'root'
})
export class SimulationModeService {
    originalModel: BehaviorSubject<PetriNet>;

    constructor(private modelService: ModelService) {
        this.originalModel = new BehaviorSubject(new PetriNet());
    }

    modelClone() {
        if (this.modelService.model === undefined) {
            this.originalModel.next(new PetriNet());
            this.modelService.model = this.originalModel.getValue().clone();
        } else {
            this.originalModel.next(this.modelService.model);
            this.modelService.model = this.originalModel.getValue().clone();
        }
    }

    modelOnDestroy() {
        this.modelService.model = this.originalModel.getValue();
    }
}
