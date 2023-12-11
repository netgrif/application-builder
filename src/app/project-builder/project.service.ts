import {Injectable} from '@angular/core';
import {PetriNet} from '@netgrif/petriflow';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  models: Array<PetriNet>;

  constructor() {
    this.models = [new PetriNet()];
  }
}
