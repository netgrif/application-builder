import {Arc as PetriflowArc, ArcType, Breakpoint, Place, Transition} from '@netgrif/petriflow';
import {ModelerConfig} from '../../modeler-config';
import {Activable} from '../activable';
import {SvgArc} from './svg-arc';
import {Point} from './point';

export class Arc implements Activable {

    public arc: PetriflowArc;
    public multiplicityLabel: string;
    public linePoints: Array<Point>;
    public objektyhrany: SvgArc;
    public cancel: any; // TODO any

    constructor(arc: PetriflowArc, source: Place | Transition, destination: Transition | Place) {
        this.arc = arc;
        this.multiplicityLabel = '';
        this.linePoints = new Array<Point>();
        this.linePoints.push(Arc.startPoint(source, destination));
        this.arc.breakpoints.forEach(breakpoint => {
            this.linePoints.push(new Point(breakpoint.x, breakpoint.y));
        });
        this.linePoints.push(Arc.endPoint(source, destination));
        if (arc.multiplicity === 1) {
            this.multiplicityLabel = '';
        } else {
            this.multiplicityLabel = String(arc.multiplicity);
        }
    }

    public static edgeResolve(noveX: number, noveY: number, povodneX: number, povodneY: number): Point {
        if (isNaN(noveX)) {
            noveX = povodneX;
        }
        if (isNaN(noveY)) {
            noveY = povodneY;
        }
        return new Point(noveX, noveY);
    }

    public static endPoint(startElement: Transition | Place | Point, endElement: Transition | Place): Point {
        return this.linePoint(endElement, -1, startElement, endElement);
    }

    public static startPoint(startElement: Transition | Place, endElement: Transition | Place | Point): Point {
        return this.linePoint(startElement, 1, startElement, endElement);
    }

    private static linePoint(element: Place | Transition, coef: number, startElement: Transition | Place | Point, endElement: Transition | Place | Point) {
        const d = this.getDiff(new Point(startElement.x, startElement.y), new Point(endElement.x, endElement.y));
        const pd = this.getPlaceDiff(d);
        const td = this.getTransitionDiff(d);
        const bool = this.diffBool(d);
        if (element instanceof Place) {
            return this.edgeResolve(element.x + pd.x * coef, element.y + pd.y * coef, startElement.x, startElement.y);
        }
        if (element instanceof Transition) {
            return this.edgeResolve(bool ? element.x + td.x * coef : element.x - td.x * coef,
                bool ? element.y + td.y * coef : element.y - td.y * coef, startElement.x, startElement.y);
        }
    }

    // TODO: find out what this condition mean
    private static diffBool(d: Point) {
        return (d.x * d.x >= d.y * d.y && d.x >= 0) || (d.x * d.x < d.y * d.y && d.y >= 0);
    }

    private static getDiff(startElement: Point, endElement: Point) {
        const startPointX = startElement.x;
        const startPointY = startElement.y;
        const endPointX = endElement.x;
        const endPointY = endElement.y;
        const dx = endPointX - startPointX;
        const dy = endPointY - startPointY;
        return new Point(dx, dy);
    }

    private static getPlaceDiff(d: Point): Point {
        const length = Math.sqrt(Math.pow(d.x, 2) + Math.pow(d.y, 2));
        const pdx = ModelerConfig.RADIUS * d.x / length;
        const pdy = ModelerConfig.RADIUS * d.y / length;
        return new Point(pdx, pdy);
    }

    private static getTransitionDiff(d: Point): Point {
        let tdx: number;
        let tdy: number;
        if (Math.pow(d.x, 2) >= Math.pow(d.y, 2)) {
            tdx = ModelerConfig.SIZE / 2;
            tdy = (ModelerConfig.SIZE / 2) * (d.y / d.x);
        } else {
            tdx = (ModelerConfig.SIZE / 2) * (d.x / d.y);
            tdy = ModelerConfig.SIZE / 2;
        }
        return new Point(tdx, tdy);
    }

    public updateBreakpoints() {
        if (this.linePoints.length <= 2) {
            this.arc.breakpoints = [];
            return;
        }
        this.arc.breakpoints = this.linePoints
            .filter((value, index) => index !== 0 && index !== this.linePoints.length - 1)
            .map(value => new Breakpoint(value.x, value.y));
    }

    activate(): void {
        if (this.objektyhrany !== undefined) {
            this.objektyhrany.polyciara.setAttributeNS(null, 'class', 'svg-active-stroke');
            if (this.arc.type === ArcType.INHIBITOR) {
                this.objektyhrany.sipka.setAttributeNS(null, 'class', 'svg-invisible-fill svg-active-stroke');
            } else {
                this.objektyhrany.sipka.setAttributeNS(null, 'class', 'svg-active-fill svg-active-stroke');
            }
            this.objektyhrany.vahaelem.setAttributeNS(null, 'class', 'svg-active-fill');
        }
    }

    deactivate(): void {
        if (this.objektyhrany !== undefined) {
            this.objektyhrany.polyciara.setAttributeNS(null, 'class', 'svg-inactive-stroke');
            if (this.arc.type === ArcType.INHIBITOR) {
                this.objektyhrany.sipka.setAttributeNS(null, 'class', 'svg-invisible-fill svg-inactive-stroke');
            } else {
                this.objektyhrany.sipka.setAttributeNS(null, 'class', 'svg-inactive-fill svg-inactive-stroke');
            }
            this.objektyhrany.vahaelem.setAttributeNS(null, 'class', 'svg-inactive-fill');
        }
    }
}
