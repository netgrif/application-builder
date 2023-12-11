import {SvgPlace} from './svg-place';
import {Activable} from '../activable';
import {ModelerConfig} from '../../modeler-config';
import {Place as PetriflowPlace} from '@netgrif/petriflow';

export class Place implements Activable {

    public static layouts = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 0, 0, 0],
        [1, 0, 1, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    public place: PetriflowPlace;
    public over: number;
    public testmarking: number;
    public markinglabel: string;
    public markingtokens: Array<Element>;
    public objektymiesta: SvgPlace;

    constructor(place: PetriflowPlace) {
        this.place = place;
        this.over = 1;
        this.testmarking = 0;
        this.markinglabel = '';
        this.markingtokens = [];
    }

    getLabelOrId() {
        if (this.place.label !== undefined && this.place.label.value !== undefined && this.place.label.value !== '') {
            return this.place.label.value;
        } else {
            return this.place.id;
        }
    }

    activate() {
        if (this.objektymiesta !== undefined) {
            this.objektymiesta.element.setAttributeNS(null, 'class', 'svg-active-stroke');
            this.objektymiesta.menoelem.setAttributeNS(null, 'class', 'svg-active-fill');
        }
        this.over = 1;
    }

    deactivate() {
        if (this.objektymiesta !== undefined) {
            this.objektymiesta.element.setAttributeNS(null, 'class', 'svg-inactive-stroke');
            this.objektymiesta.menoelem.setAttributeNS(null, 'class', 'svg-inactive-fill');
            this.objektymiesta.element.setAttributeNS(null, 'fill', 'white');
            if (this.place.static) {
                this.objektymiesta.element.setAttributeNS(null, 'stroke-dasharray', '14, 5');
                this.objektymiesta.element.setAttributeNS(null, 'stroke-width', '3');
            } else {
                this.objektymiesta.element.setAttributeNS(null, 'stroke-width', '2');
            }
        }
        this.over = 0;
    }
}
