import {PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';
import {Arc} from './arc/arc';
import {Place} from './place/place';
import {Transition} from './transition/transition';

export class PetriNet {
  public arcForData: Arc; // TODO refactor
  public file: string;
  public fileName: string;
  public model: PetriflowPetriNet;
  public transitions: Array<Transition>;
  public places: Array<Place>;
  public arcs: Array<Arc>;

  constructor(model: PetriflowPetriNet) {
    this.model = model;
    this.fileName = 'new_model.xml';
    this.transitions = [];
    this.places = [];
    this.arcs = [];
  }
}
