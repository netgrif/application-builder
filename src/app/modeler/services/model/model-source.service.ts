import {Injectable} from '@angular/core';
import {PetriNet} from '@netgrif/petriflow';
import {ModelSource} from './model-source';
import {ModelService} from './model.service';
import {SimulationModeService} from '../../simulation-mode/simulation-mode.service';
import {Router} from '@angular/router';
import {SimulationModeComponent} from '../../simulation-mode/simulation-mode.component';

@Injectable({
    providedIn: 'root'
})
export class ModelSourceService {

    constructor(
        private router: Router,
        private modelService: ModelService,
        private simulationService: SimulationModeService
    ) {
    }

    public getModel(): PetriNet {
        console.log(`route: ${this.router.url}, is sim: ${this.router.url.includes(SimulationModeComponent.URL)}`);
        if (this.router.url.includes(SimulationModeComponent.URL)) {
            return this.simulationService.model;
        }
        return this.modelService.model;
    }
}
