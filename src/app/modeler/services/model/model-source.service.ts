import {Injectable} from '@angular/core';
import {PetriNet} from '@netgrif/petriflow';
import {ModelSource} from './model-source';
import {ModelService} from './model.service';

@Injectable({
    providedIn: 'root'
})
export class ModelSourceService {

    private _source: ModelSource;

    constructor(
        private modelService: ModelService
    ) {
        // TODO: release/4.0.0 fix init
        this.source = modelService;
    }

    public set source(value: ModelSource) {
        this._source = value;
    }

    public getModel(): PetriNet {
        return this._source.model;
    }
}
