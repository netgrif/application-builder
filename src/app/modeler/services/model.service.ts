import {Injectable} from '@angular/core';
import {BehaviorSubject, ReplaySubject} from 'rxjs';
import {Point} from '../classes/arc/point';
import {Arc} from '../classes/arc/arc';
import {PetriNet} from '../classes/petri-net';
import {ModelerConfig} from '../modeler-config';
import {Transition} from '../classes/transition/transition';
import {Place} from '../classes/place/place';
import {ExportService, PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';

@Injectable({
    providedIn: 'root'
})
export class ModelService {

    previousStatus; // TODO any
    hranabymove; // TODO any
    bod: Point;
    kresli_sa_hrana: number;
    source_hrany: Transition | Place;
    pocetmousedown: number;
    pocetmousedownright: number;
    sirkatextu: number;
    fontfamily: string;
    korekcia: number;
    vahaoffset: number;
    posuva_sa_hrana: number; // TODO boolean
    pocetmousedownposuv: number;
    pocetmousedownposuvtran: number;
    pocetmousedownposuvplace: number;

    posuvanahrana: Arc;
    indexbodu: any; // TODO any
    hybesaprechod: number;
    hybesamiesto: number;
    movedprechod: Transition;
    movedmiesto: Place;

    text: string;
    menofilu: string;
    appwidth: number;
    appheight: number;

    id: number;
    placeId: number;
    transitionId: number;
    arcId: number;
    private _model: PetriflowPetriNet; // petriflow.js
    graphicModel: PetriNet; // petriflow.svg
    transition: Transition;
    whichButton: BehaviorSubject<string>;
    dropZoneEvent: ReplaySubject<string>;

    public arcForData;
    public file: string;

    constructor(private exportService: ExportService) {
        this.bod = new Point(0, 0);
        this.kresli_sa_hrana = 0;
        this.pocetmousedown = 0;
        this.sirkatextu = 0;
        this.fontfamily = 'verdana';
        this.korekcia = 0.75 * ModelerConfig.FONT_SIZE;
        this.vahaoffset = 10;
        this.posuva_sa_hrana = 0;
        this.pocetmousedownposuv = 0;
        this.pocetmousedownposuvtran = 0;
        this.pocetmousedownposuvplace = 0;
        this.hybesaprechod = 0;
        this.hybesamiesto = 0;

        this.text = '';
        this.menofilu = 'newmodel.xml';
        this.appwidth = 10000;
        this.appheight = 5000;
        ModelerConfig.GRID_STEP = 2 * ModelerConfig.COORDINATES_OFFSET;
        ModelerConfig.MAX_X = ModelerConfig.MAX_WIDTH - ModelerConfig.COORDINATES_OFFSET;
        ModelerConfig.MAX_Y = ModelerConfig.MAX_HEIGHT - ModelerConfig.COORDINATES_OFFSET;

        this.whichButton = new BehaviorSubject('select');
        this.dropZoneEvent = new ReplaySubject(1);
        this.id = 0;
        this.placeId = 0;
        this.transitionId = 0;
        this.arcId = 0;
    }

    set model(value: PetriflowPetriNet) {
        this._model = value;
        this.placeId = Math.max(...(value.getPlaces().filter(p => p.id.startsWith('p')).map(p => Number.parseInt(p.id.substr(1), 10)).filter(id => !isNaN(id))), 0);
        this.transitionId = Math.max(...(value.getTransitions().filter(t => t.id.startsWith('t')).map(t => Number.parseInt(t.id.substr(1), 10)).filter(id => !isNaN(id))), 0);
        this.arcId = Math.max(...(value.getArcs().filter(a => a.id.startsWith('a')).map(a => Number.parseInt(a.id.substr(1), 10)).filter(id => !isNaN(id))), 0);
    }

    get model(): PetriflowPetriNet {
        return this._model;
    }

    isEmptyModel(): boolean {
        return this._model.getTransactions().length === 0 && this._model.getPlaces().length === 0 && this._model.getArcs().length === 0 &&
            this._model.getDataSet().length === 0 && this._model.getTransactions().length === 0 && this._model.getRoles().length === 0;
    }

    updatePreviousState() {
        this.previousStatus = this.exportService.generateXml(this._model);
    }

    nextId(): number {
        this.id++;
        return this.id;
    }

    nextPlaceId(): number {
        this.placeId++;
        return this.placeId;
    }

    nextTransitionId(): number {
        this.transitionId++;
        return this.transitionId;
    }

    nextArcId(): number {
        this.arcId++;
        return this.arcId;
    }

    resetId(): void {
        this.id = 0;
    }
}
