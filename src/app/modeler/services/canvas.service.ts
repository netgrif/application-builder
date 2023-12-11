import {Injectable} from '@angular/core';
import {ModelService} from './model.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {Canvas} from '../classes/canvas';
import {DialogArcAttachComponent} from '../../dialogs/dialog-arc-attach/dialog-arc-attach.component';
import {
    Arc as PetriflowArc,
    ArcType,
    Breakpoint,
    DataVariable,
    I18nString,
    PetriNet as PetriflowPetriNet,
    Place as PetriflowPlace,
    Transition as PetriflowTransition
} from '@netgrif/petriflow';
import {MatDialog} from '@angular/material/dialog';
import {MatSidenav} from '@angular/material/sidenav';
import {Title} from '@angular/platform-browser';
import {Arc} from '../classes/arc/arc';
import {ModelerConfig} from '../modeler-config';
import {SvgArc} from '../classes/arc/svg-arc';
import {Point} from '../classes/arc/point';
import {SvgArcMove} from '../classes/arc/svg-arc-move';
import {Transition} from '../classes/transition/transition';
import {Place} from '../classes/place/place';
import {SvgPlace} from '../classes/place/svg-place';
import {SvgTransition} from '../classes/transition/svg-transition';
import {PetriNet} from '../classes/petri-net';
import {FastPnService} from '../edit-mode/fast-pn.service';
import {FastPnMode} from '../edit-mode/fast-pn-mode.enum';
import {SelectedTransitionService} from '../selected-transition.service';
import {
    DialogPlaceRefDeleteComponent,
    PlaceRefDeleteData
} from '../../dialogs/dialog-place-ref-delete/dialog-place-ref-delete.component';

@Injectable({
    providedIn: 'root'
})
export class CanvasService {

    public static svgNamespace = 'http://www.w3.org/2000/svg';
    public selectedTransition: BehaviorSubject<Transition>;
    public model: BehaviorSubject<PetriflowPetriNet>;
    public canvas: Canvas;
    public hranaForPlaceref: Arc;
    public hranaForPlacerefClicked = false;
    public openSideNav: Subject<boolean>;
    protected _editSideNav: MatSidenav;
    protected _fireModes: Array<string> = ['fire', 'fire-task'];

    isActiveFastPn: BehaviorSubject<boolean>;
    afterContextClose = false;
    isCustomFastPn: BehaviorSubject<boolean>;
    hasBeenDone: boolean;
    startAgain: BehaviorSubject<boolean>;

    constructor(protected _modelService: ModelService, protected _title: Title, protected _dialog: MatDialog, public fastPnService: FastPnService, private transitionService: SelectedTransitionService) {
        this.selectedTransition = new BehaviorSubject<Transition>(new Transition(new PetriflowTransition(0, 0, ''), []));
        this.model = new BehaviorSubject<PetriflowPetriNet>(this._modelService.model);
        this.openSideNav = new Subject<boolean>();
        this.isActiveFastPn = new BehaviorSubject<boolean>(false);
        this.isCustomFastPn = new BehaviorSubject<boolean>(false);
        this.startAgain = new BehaviorSubject<boolean>(false);
    }

    renderModel(model: PetriflowPetriNet): void {
        this.deleteAll();
        this.model.next(model);
        this._modelService.graphicModel = new PetriNet(model);
        model.getTransitions().forEach(t => {
            const trans = new Transition(t, model.getDataSet());
            this._modelService.graphicModel.transitions.push(trans);
            this.renderTransition(trans);
            const intId = parseInt(t.id, 10);
            if (!isNaN(intId) && this._modelService.id < intId) {
                this._modelService.id = intId;
            }
        });
        model.getPlaces().forEach(place => {
            const p = new Place(place);
            this._modelService.graphicModel.places.push(p);
            this.renderPlace(p);
            const intId = parseInt(place.id, 10);
            if (!isNaN(intId) && this._modelService.id <= intId) {
                this._modelService.id = intId;
            }
        });
        model.getArcs().forEach(arc => {
            const a = new Arc(arc, this.resolveArcSource(arc), this.resolveArcDestination(arc));
            this._modelService.graphicModel.arcs.push(a);
            this.renderArc(a);
            const intId = parseInt(arc.id, 10);
            if (!isNaN(intId) && this._modelService.id < intId) {
                this._modelService.id = intId;
            }
        });
        this.elementypredhrany(this._modelService.graphicModel);
        this.labelypredhranyprve(this._modelService.graphicModel);
        this.renderIcons(this._modelService.graphicModel);
        this._title.setTitle(`${model.title.value} (${model.id})`);
    }

    private renderIcons(model: PetriNet): void {
        model.transitions.filter(t => t.transition.icon !== undefined && t.transition.icon.length > 0).forEach(t => {
            this.renderIcon(t);
        });
    }

    renderArc(arc: Arc): void {
        arc.objektyhrany = this.novy_svg_arc(arc, arc.linePoints[0], arc.linePoints[1]);
        if (arc.arc.reference !== undefined) {
            const placeRef = this._modelService.model.getPlaces().find(p => p.id === arc.arc.reference);
            if (placeRef !== undefined) {
                const placeVal = placeRef.marking;
                if (placeVal !== arc.arc.multiplicity) {
                    this.updatePlaceRefVahuHrany();
                }
                arc.objektyhrany.vaha.nodeValue = `${placeRef.label.value === '' ? '""' : placeRef.label.value} ${'(' + arc.arc.multiplicity + ')'}`;
            } else {
                const dataRef = this._modelService.model.getData(arc.arc.reference);
                const datarefVal = parseInt(dataRef.init.expression, 10);
                if (datarefVal !== arc.arc.multiplicity) {
                    this.updateDataRefVahuHrany();
                }
                arc.objektyhrany.vaha.nodeValue = `${dataRef.title.value === '' ? '""' : dataRef.title.value} ${'(' + arc.arc.multiplicity + ')'}`;
            }
        } else {
            arc.objektyhrany.vaha.nodeValue = arc.multiplicityLabel;
        }
        this.updatehranusvg(arc);
    }

    renderTransition(t: Transition): void {
        t.objektyelementu = this.novy_svg_transition(t, t.transition.x, t.transition.y, ModelerConfig.SIZE);
        t.objektyelementu.meno.nodeValue = t.getLabelOrId();
    }

    renderPlace(place: Place): void {
        place.objektymiesta = this.novy_svg_place(place, place.place.x, place.place.y, ModelerConfig.RADIUS);
        place.objektymiesta.meno.nodeValue = place.getLabelOrId();
        this.updatetokeny(place);
    }

    elementypredhrany(model: PetriNet): void {
        for (const place of model.places) {
            this.canvas.add(place.objektymiesta.element);
            place.deactivate();
            for (const markToken of place.markingtokens) {
                this.canvas.add(markToken);
            }
            place.objektymiesta.svgmarking.appendChild(place.objektymiesta.markingnode);
            this.canvas.add(place.objektymiesta.svgmarking);
        }
        this.updatemarkings();
        this.updatePlaceRefVahuHrany();
        for (const transition of model.transitions) {
            this.canvas.add((transition as Transition).objektyelementu.element);
            this.canvas.add(transition.objektyelementu.finishArrow);
            this.canvas.add(transition.objektyelementu.cancelArrow);
            (transition as Transition).deactivate();
        }
    }

    novy_svg_temp_arc(start: Place | Transition | Point, end: Place | Transition | Point, arctype: ArcType): SvgArcMove {
        let zaciatok: Breakpoint;
        let koniec: Breakpoint;
        if (start instanceof Place) {
            zaciatok = new Breakpoint(start.place.x, start.place.y);
        } else if (start instanceof Transition) {
            zaciatok = new Breakpoint(start.transition.x, start.transition.y);
        } else {
            zaciatok = new Breakpoint(start.x, start.y);
        }
        if (end instanceof Place) {
            koniec = new Breakpoint(end.place.x, end.place.y);
        } else if (end instanceof Transition) {
            koniec = new Breakpoint(end.transition.x, end.transition.y);
        } else {
            koniec = new Breakpoint(end.x, end.y);
        }
        const dx = koniec.x - zaciatok.x;
        const dy = koniec.y - zaciatok.y;
        const dlzkahrany = Math.sqrt(dx * dx + dy * dy);
        const dlzkaskratena = dlzkahrany - ModelerConfig.ARROW_HEAD_SIZE + 2;
        const pomer = dlzkaskratena / dlzkahrany;
        const nx = zaciatok.x + dx * pomer;
        const ny = zaciatok.y + dy * pomer;

        const polyciara = document.createElementNS(CanvasService.svgNamespace, 'polyline');

        polyciara.setAttributeNS(null, 'points', zaciatok.x + ',' + zaciatok.y + ' ' + nx + ',' + ny);
        polyciara.setAttributeNS(null, 'fill', 'none');
        polyciara.setAttributeNS(null, 'stroke-width', '2');
        polyciara.setAttributeNS(null, 'class', 'svg-active-stroke');

        this.canvas.add(polyciara);

        let sipka;
        if (arctype === ArcType.INHIBITOR || arctype === ArcType.READ) {
            sipka = document.createElementNS(CanvasService.svgNamespace, 'circle');
            sipka.setAttributeNS(null, 'cx', String(this.bodInhibitorSipky(zaciatok.x, zaciatok.y, koniec.x, koniec.y).x));
            sipka.setAttributeNS(null, 'cy', String(this.bodInhibitorSipky(zaciatok.x, zaciatok.y, koniec.x, koniec.y).y));
            sipka.setAttributeNS(null, 'r', `${ModelerConfig.ARROW_HEAD_SIZE / 2}`);
            if (arctype === ArcType.INHIBITOR) {
                sipka.setAttributeNS(null, 'class', 'svg-active-stroke svg-invisible-fill');
            } else {
                sipka.setAttributeNS(null, 'class', 'svg-active-stroke svg-active-fill');
            }
            sipka.setAttributeNS(null, 'stroke-width', '2');
        } else {
            sipka = document.createElementNS(CanvasService.svgNamespace, 'polygon');
            sipka.setAttributeNS(null, 'points', this.bodySipky(zaciatok.x, zaciatok.y, koniec.x, koniec.y, arctype));
            sipka.setAttributeNS(null, 'class', 'svg-active-fill svg-active-stroke');
        }

        this.canvas.add(sipka);

        return new SvgArcMove(polyciara, sipka, arctype);
    }

    novy_svg_arc(arc: Arc, zaciatok: Point, koniec: Point): SvgArc {
        const dx = koniec.x - zaciatok.x;
        const dy = koniec.y - zaciatok.y;
        const dlzkahrany = Math.sqrt(dx * dx + dy * dy);
        const dlzkaskratena = dlzkahrany - ModelerConfig.ARROW_HEAD_SIZE + 2;
        const pomer = dlzkaskratena / dlzkahrany;
        const nx = zaciatok.x + dx * pomer;
        const ny = zaciatok.y + dy * pomer;

        const polyciarapod = document.createElementNS(CanvasService.svgNamespace, 'polyline') as SVGPolylineElement;
        polyciarapod.id = `svg_arc_background_${arc.arc.id}`;
        polyciarapod.setAttributeNS(null, 'points', zaciatok.x + ',' + zaciatok.y + ' ' + nx + ',' + ny);
        polyciarapod.setAttributeNS(null, 'fill', 'none');
        polyciarapod.setAttributeNS(null, 'stroke-width', '4');
        polyciarapod.setAttributeNS(null, 'stroke', 'white');

        this.canvas.add(polyciarapod);
        const polyciara = document.createElementNS(CanvasService.svgNamespace, 'polyline') as SVGPolylineElement;
        polyciara.id = `svg_arc_${arc.arc.id}`;
        polyciara.setAttributeNS(null, 'points', zaciatok.x + ',' + zaciatok.y + ' ' + nx + ',' + ny);
        polyciara.setAttributeNS(null, 'fill', 'none');
        polyciara.setAttributeNS(null, 'stroke-width', '2');

        this.canvas.add(polyciara);
        let sipka;
        if (arc.arc.type === ArcType.INHIBITOR || arc.arc.type === ArcType.READ) {
            sipka = document.createElementNS(CanvasService.svgNamespace, 'circle') as SVGCircleElement;

            sipka.setAttributeNS(null, 'cx', this.bodInhibitorSipky(zaciatok.x, zaciatok.y, koniec.x, koniec.y).x);
            sipka.setAttributeNS(null, 'cy', this.bodInhibitorSipky(zaciatok.x, zaciatok.y, koniec.x, koniec.y).y);
            sipka.setAttributeNS(null, 'r', `${ModelerConfig.ARROW_HEAD_SIZE / 2}`);
            arc.arc.type === ArcType.INHIBITOR ? sipka.setAttributeNS(null, 'fill', 'white') : sipka.setAttributeNS(null, 'fill', 'black');
            sipka.setAttributeNS(null, 'class', 'svg-inactive-stroke');
            sipka.setAttributeNS(null, 'stroke-width', '2');
        } else {
            sipka = document.createElementNS(CanvasService.svgNamespace, 'polygon') as SVGPolygonElement;
            sipka.setAttributeNS(null, 'points', this.bodySipky(zaciatok.x, zaciatok.y, koniec.x, koniec.y, arc.arc.type));
            sipka.setAttributeNS(null, 'class', 'svg-inactive-stroke');
            sipka.setAttributeNS(null, 'stroke', 'black');
        }
        sipka.id = `svg_arc_end_${arc.arc.id}`;
        this.canvas.add(sipka);

        const vahaelem = document.createElementNS(CanvasService.svgNamespace, 'text') as SVGTextElement;
        const bodvaha = this.bodvahy(zaciatok, koniec);
        vahaelem.id = `svg_arc_multiplicity_${arc.arc.id}`;
        vahaelem.setAttributeNS(null, 'x', String(bodvaha.x));
        vahaelem.setAttributeNS(null, 'y', String(bodvaha.y));
        vahaelem.setAttributeNS(null, 'font-size', ModelerConfig.FONT_SIZE.toString());
        vahaelem.setAttributeNS(null, 'font-family', this._modelService.fontfamily);
        const vaha = document.createTextNode(arc.multiplicityLabel);
        vahaelem.appendChild(vaha);
        this.canvas.add(vahaelem);

        vahaelem.setAttributeNS(null, 'x', `${bodvaha.x - this._modelService.vahaoffset / 3}`);
        vahaelem.setAttributeNS(null, 'y', `${bodvaha.y + this._modelService.vahaoffset / 2}`);

        polyciarapod.onmouseover = polyciara.onmouseover = sipka.onmouseover = vahaelem.onmouseover = () => {
            if (!this.isFireMode()) {
                arc.activate();
            }
        };
        polyciarapod.onmouseout = polyciara.onmouseout = sipka.onmouseout = vahaelem.onmouseout = () => {
            if (!this.isFireMode() && !(this.hranaForPlaceref && this.hranaForPlaceref.arc.id === arc.arc.id)) {
                arc.deactivate();
            }
        };
        polyciarapod.onmousedown = polyciara.onmousedown = sipka.onmousedown = (event) => {
            this.mysdownnahrane(event, arc, polyciarapod, polyciara, sipka, vaha, vahaelem);
        };

        vahaelem.onmousedown = () => {
            if (this._modelService.whichButton.getValue() === 'arc_weight' && (arc.arc.type !== ArcType.RESET)) {

                let arcVaha = arc.arc.multiplicity;
                const zadane = prompt('Please enter positive arc weight', String(arc.arc.multiplicity));

                if (zadane != null) {
                    arcVaha = parseInt(zadane, 10);

                    if (isNaN(arcVaha)) {
                        alert('Not a number');
                        return;
                    }

                    if (arcVaha <= 0) {
                        alert('Not positive number');
                        return;
                    }

                    arc.arc.multiplicity = arcVaha;
                    arc.arc.reference = undefined;
                    if (arcVaha === 1) {
                        arc.multiplicityLabel = '';
                    } else {
                        arc.multiplicityLabel = String(arcVaha);
                    }
                    // arcVaha.nodeValue = arc.vahalabel;
                }
            }
        };

        return new SvgArc(polyciarapod, polyciara, sipka, vahaelem, vaha);
    }

    mysdownnahrane(event: MouseEvent, element: Arc, svgelement: SVGPolylineElement, svgelement1: SVGPolylineElement, svgelement2: HTMLElement, labelnode: Text, svgMeno: SVGTextElement): void {

        if (this._modelService.whichButton.getValue() === 'delete') {
            const novyBod = new Point(0, 0);

            novyBod.x = this.getMousePositionX(event);
            novyBod.y = this.getMousePositionY(event);

            let deletujembod = 0;

            for (let i = 1; i < element.linePoints.length - 1; i++) {
                if (Math.abs(element.linePoints[i].x - novyBod.x) <= 5 && Math.abs(element.linePoints[i].y - novyBod.y) <= 5) {
                    element.linePoints.splice(i, 1);
                    element.updateBreakpoints();
                    this.updatehranusvg(element);
                    deletujembod = 1;
                    break;
                }
            }

            if (deletujembod === 0) {
                this.canvas.remove(svgelement);
                this.canvas.remove(svgelement1);
                this.canvas.remove(svgelement2);
                svgMeno.removeChild(labelnode);
                this.canvas.remove(svgMeno);

                this._modelService.model.removeArc(element.arc.id);
                const j = this._modelService.graphicModel.arcs.indexOf(element);
                this._modelService.graphicModel.arcs.splice(j, 1);
            }
        }

        if (this._modelService.whichButton.getValue() === 'position') {
            const novyBod = new Point(0, 0);

            novyBod.x = this.getMousePositionX(event);
            novyBod.y = this.getMousePositionY(event);

            for (let i = 1; i < element.linePoints.length - 1; i++) {
                if (Math.abs(element.linePoints[i].x - novyBod.x) <= 5 && Math.abs(element.linePoints[i].y - novyBod.y) <= 5) {
                    this._modelService.indexbodu = i;
                    let doit = false;
                    let novex = element.linePoints[i].x;
                    let novey = element.linePoints[i].y;
                    const a = prompt('Please enter x-coordinate of the point (not smaller than ' + ModelerConfig.COORDINATES_OFFSET +
                        ' and not greater than ' + ModelerConfig.MAX_X + ' ):', `${element.linePoints[i].x}`);
                    if (a != null) {
                        const x = parseInt(a, 10);
                        if (isNaN(x)) {
                            alert('x is not a number');
                        } else {
                            if (x <= ModelerConfig.COORDINATES_OFFSET || ModelerConfig.MAX_X <= x) {
                                alert('x is out of dimension');
                            } else {
                                novex = x;
                                doit = true;
                            }
                        }
                    }
                    const b = prompt('Please enter y-coordinate of the point (not smaller than ' + ModelerConfig.COORDINATES_OFFSET +
                        ' and not greater than ' + ModelerConfig.MAX_Y + ' ):', `${element.linePoints[i].y}`);
                    if (b != null) {
                        const y = parseInt(b, 10);
                        if (isNaN(y)) {
                            alert('y is not a number');
                        } else {
                            if (y <= ModelerConfig.COORDINATES_OFFSET || ModelerConfig.MAX_Y <= y) {
                                alert('y is out of dimension');
                            } else {
                                novey = y;
                                doit = true;
                            }
                        }
                    }
                    if (doit) {
                        element.linePoints[i].x = novex;
                        element.linePoints[i].y = novey;
                        element.updateBreakpoints();
                        this.updatehranusvg(element);
                    }
                    break;
                }
            }
        }

        if (this._modelService.whichButton.getValue() === 'move') {
            if (this._modelService.posuva_sa_hrana === 0) {
                const novyBod = new Point(0, 0);

                novyBod.x = this.getMousePositionX(event);
                novyBod.y = this.getMousePositionY(event);

                for (let i = 1; i < element.linePoints.length - 1; i++) {
                    if (Math.abs(element.linePoints[i].x - novyBod.x) <= 5 && Math.abs(element.linePoints[i].y - novyBod.y) <= 5) {
                        this._modelService.indexbodu = i;
                        this._modelService.posuvanahrana = element;
                        this._modelService.posuva_sa_hrana = 1;
                        this.updatehranusvg(element);
                        break;
                    }
                }

                if (this._modelService.posuva_sa_hrana === 0) {
                    for (let i = 0; i < element.linePoints.length - 1; i++) {
                        const dx = element.linePoints[i + 1].x - element.linePoints[i].x;
                        const dy = element.linePoints[i + 1].y - element.linePoints[i].y;
                        const dxn = novyBod.x - element.linePoints[i].x;
                        const dyn = novyBod.y - element.linePoints[i].y;
                        const dlzkahrany = Math.sqrt(dx * dx + dy * dy);
                        const dlzkapomys = Math.sqrt(dxn * dxn + dyn * dyn);
                        const pomer = dlzkapomys / dlzkahrany;
                        const nx = element.linePoints[i].x + dx * pomer;
                        const ny = element.linePoints[i].y + dy * pomer;

                        if (Math.abs(nx - novyBod.x) <= 2 && Math.abs(ny - novyBod.y) <= 2) {
                            element.linePoints.splice(i + 1, 0, novyBod);
                            element.updateBreakpoints();
                            this._modelService.indexbodu = i + 1;
                            this._modelService.posuvanahrana = element;
                            this._modelService.posuva_sa_hrana = 1;
                            this.updatehranusvg(element);
                            break;
                        }
                    }
                }
            }
        }

        if (this._modelService.whichButton.getValue() === 'arc_weight' && (element.arc.type !== ArcType.RESET)) {
            let vaha = element.arc.multiplicity;
            const zadane = prompt('Please enter positive arc weight', String(element.arc.multiplicity));

            if (zadane != null) {
                vaha = parseInt(zadane, 10);
                if (isNaN(vaha)) {
                    alert('Not a number');
                    return;
                }

                if (vaha <= 0) {
                    alert('Not positive number');
                    return;
                }

                element.arc.multiplicity = vaha;
                element.arc.reference = undefined;
                if (vaha === 1) {
                    element.multiplicityLabel = '';
                } else {
                    element.multiplicityLabel = String(vaha);
                }
                labelnode.nodeValue = element.multiplicityLabel;
            }
        }

        if (this._modelService.whichButton.getValue() === 'arc_dataref' && (element.arc.type !== ArcType.RESET)) {
            this.openAttachDialog(element);
        }

        if (this._modelService.whichButton.getValue() === 'arc_placeref' && (element.arc.type !== ArcType.RESET)) {
            this.hranaForPlacerefClicked = true;
            this.deletePlaceReferenceData(element.arc.id);
            if (this.hranaForPlaceref !== undefined) {
                this.hranaForPlaceref.deactivate();
            }
            this.hranaForPlaceref = element;
            element.activate();
        }
    }

    skrathranu(element: Arc): Point {
        const i = element.linePoints.length - 2;
        const dx = element.linePoints[i + 1].x - element.linePoints[i].x;
        const dy = element.linePoints[i + 1].y - element.linePoints[i].y;
        const dlzkahrany = Math.sqrt(dx * dx + dy * dy);
        const dlzkaskratena = dlzkahrany - ModelerConfig.ARROW_HEAD_SIZE + 2;
        const pomer = dlzkaskratena / dlzkahrany;
        const nx = element.linePoints[i].x + dx * pomer;
        const ny = element.linePoints[i].y + dy * pomer;

        return new Point(nx, ny);
    }

    updatehranusvg(hrana: Arc): void {
        let text = '';
        const last = hrana.linePoints.length - 1;
        const stred = parseInt(String(last / 2), 10);

        const source = this.resolveArcSource(hrana);
        const destination = this.resolveArcDestination(hrana);

        if (hrana.linePoints.length > 2) {
            hrana.linePoints[0] = Arc.startPoint(source, hrana.linePoints[1]);
            hrana.linePoints[last] = Arc.endPoint(hrana.linePoints[last - 1], destination);
        } else {
            hrana.linePoints[0] = Arc.startPoint(source, destination);
            hrana.linePoints[last] = Arc.endPoint(source, destination);
        }
        hrana.updateBreakpoints();

        const bodvaha = this.bodvahy(hrana.linePoints[stred], hrana.linePoints[stred + 1]);
        for (let i = 0; i < hrana.linePoints.length - 1; i++) {
            text = text + hrana.linePoints[i].x + ',' + hrana.linePoints[i].y + ' ';
        }

        const skratenykoniec = this.skrathranu(hrana);
        text = text + skratenykoniec.x + ',' + skratenykoniec.y;

        if (this._modelService.posuva_sa_hrana === 1) {
            hrana.activate();
        } else {
            hrana.deactivate();
        }
        hrana.objektyhrany.polyciarapod.setAttributeNS(null, 'points', text);
        hrana.objektyhrany.polyciara.setAttributeNS(null, 'points', text);

        if (hrana.arc.type === ArcType.INHIBITOR || hrana.arc.type === ArcType.READ) {
            hrana.objektyhrany.sipka.setAttributeNS(null, 'cx', String(this.bodInhibitorSipky(hrana.linePoints[last - 1].x,
                hrana.linePoints[last - 1].y, hrana.linePoints[last].x, hrana.linePoints[last].y).x));
            hrana.objektyhrany.sipka.setAttributeNS(null, 'cy', String(this.bodInhibitorSipky(hrana.linePoints[last - 1].x,
                hrana.linePoints[last - 1].y, hrana.linePoints[last].x, hrana.linePoints[last].y).y));
        } else {
            hrana.objektyhrany.sipka.setAttributeNS(null, 'points', this.bodySipky(hrana.linePoints[last - 1].x,
                hrana.linePoints[last - 1].y, hrana.linePoints[last].x, hrana.linePoints[last].y, hrana.arc.type));
        }

        hrana.objektyhrany.vahaelem.setAttributeNS(null, 'x', `${bodvaha.x - this._modelService.vahaoffset / 3}`);
        hrana.objektyhrany.vahaelem.setAttributeNS(null, 'y', `${bodvaha.y + this._modelService.vahaoffset / 2}`);
    }

    bodvahy(startbod: Point, endbod: Point): Point {
        const startPointX = startbod.x;
        const startPointY = startbod.y;
        const endPointX = endbod.x;
        const endPointY = endbod.y;

        const dx = (endPointX - startPointX) / 2;
        const dy = (endPointY - startPointY) / 2;

        const length = Math.sqrt(dx * dx + dy * dy);
        const unitDx = dx / length;
        const unitDy = dy / length;
        let x;
        let y;

        if (dx >= 0 && dy >= 0) {
            x = (endPointX - dx + unitDy * this._modelService.vahaoffset);
            y = (endPointY - dy - unitDx * this._modelService.vahaoffset);
        }
        if (dx >= 0 && dy < 0) {
            x = (endPointX - dx - unitDy * this._modelService.vahaoffset);
            y = (endPointY - dy + unitDx * this._modelService.vahaoffset);
        }
        if (dx < 0 && dy > 0) {
            x = (endPointX - dx + unitDy * this._modelService.vahaoffset);
            y = (endPointY - dy - unitDx * this._modelService.vahaoffset);
        }
        if (dx < 0 && dy <= 0) {
            x = (endPointX - dx - unitDy * this._modelService.vahaoffset);
            y = (endPointY - dy + unitDx * this._modelService.vahaoffset);
        }

        return new Point(x, y);
    }

    bodInhibitorSipky(startPointX: number, startPointY: number, endPointX: number, endPointY: number): Point {
        const dx = endPointX - startPointX;
        const dy = endPointY - startPointY;

        const length = Math.sqrt(dx * dx + dy * dy);
        const unitDx = dx / length;
        const unitDy = dy / length;

        const inhibitorPointX = (endPointX - unitDx * ModelerConfig.ARROW_HEAD_SIZE / 2);
        const inhibitorPointY = (endPointY - unitDy * ModelerConfig.ARROW_HEAD_SIZE / 2);

        return new Point(inhibitorPointX, inhibitorPointY);
    }

    bodySipky(startPointX: number, startPointY: number, endPointX: number, endPointY: number, arctype: ArcType): string {
        const dx = endPointX - startPointX;
        const dy = endPointY - startPointY;

        const length = Math.sqrt(dx * dx + dy * dy);
        const unitDx = dx / length;
        const unitDy = dy / length;

        const arrowPoint1X = (endPointX - unitDx * ModelerConfig.ARROW_HEAD_SIZE - 0.5 * unitDy * ModelerConfig.ARROW_HEAD_SIZE);
        const arrowPoint1Y = (endPointY - unitDy * ModelerConfig.ARROW_HEAD_SIZE + 0.5 * unitDx * ModelerConfig.ARROW_HEAD_SIZE);

        const arrowPoint2X = (endPointX - unitDx * ModelerConfig.ARROW_HEAD_SIZE + 0.5 * unitDy * ModelerConfig.ARROW_HEAD_SIZE);
        const arrowPoint2Y = (endPointY - unitDy * ModelerConfig.ARROW_HEAD_SIZE - 0.5 * unitDx * ModelerConfig.ARROW_HEAD_SIZE);

        if (arctype === ArcType.RESET) {
            const arrowPoint3X = (endPointX - unitDx * ModelerConfig.ARROW_HEAD_SIZE);
            const arrowPoint3Y = (endPointY - unitDy * ModelerConfig.ARROW_HEAD_SIZE);
            const arrowPoint4X = (arrowPoint3X - unitDx * ModelerConfig.ARROW_HEAD_SIZE - 0.5 * unitDy * ModelerConfig.ARROW_HEAD_SIZE);
            const arrowPoint4Y = (arrowPoint3Y - unitDy * ModelerConfig.ARROW_HEAD_SIZE + 0.5 * unitDx * ModelerConfig.ARROW_HEAD_SIZE);

            const arrowPoint5X = (arrowPoint3X - unitDx * ModelerConfig.ARROW_HEAD_SIZE + 0.5 * unitDy * ModelerConfig.ARROW_HEAD_SIZE);
            const arrowPoint5Y = (arrowPoint3Y - unitDy * ModelerConfig.ARROW_HEAD_SIZE - 0.5 * unitDx * ModelerConfig.ARROW_HEAD_SIZE);

            return (endPointX + ',' + endPointY + ' ' + arrowPoint1X + ',' + arrowPoint1Y + ' ' + arrowPoint3X + ',' + arrowPoint3Y + ' ' +
                arrowPoint4X + ',' + arrowPoint4Y + ' ' + arrowPoint5X + ',' + arrowPoint5Y + ' ' + arrowPoint3X + ',' + arrowPoint3Y + ' ' +
                arrowPoint2X + ',' + arrowPoint2Y + ' ');

        }

        return (endPointX + ',' + endPointY + ' ' + arrowPoint1X + ',' + arrowPoint1Y + ' ' + arrowPoint2X + ',' + arrowPoint2Y + ' ');
    }

    reset(): void {
        this.reset_hranu();
        for (const transition of this._modelService.graphicModel?.transitions) {
            if (this.isFireMode()) {
                if (transition.firing) {
                    this.cancel(transition);
                    this.updatemarkings();
                    this.updatePlaceRefVahuHrany();
                }
                if (this.enabled(transition)) {
                    transition.enable();
                } else {
                    transition.disable();
                }
            } else {
                transition.deactivate();
            }
        }
    }

    reset_hranu(): void {
        if (this._modelService.posuva_sa_hrana === 1) {
            this._modelService.posuvanahrana.deactivate();
            this._modelService.pocetmousedownposuv = 0;
            this._modelService.posuva_sa_hrana = 0;
        }
        if (this._modelService.kresli_sa_hrana === 1) {
            this.canvas.remove(this._modelService.hranabymove.polyciara);
            this.canvas.remove(this._modelService.hranabymove.sipka);

            this._modelService.pocetmousedown = 0;
            this._modelService.kresli_sa_hrana = 0;
        }
        this.hranaForPlacerefClicked = false;
        if (this.hranaForPlaceref) {
            this.hranaForPlaceref.deactivate();
            this.hranaForPlaceref = undefined;
        }
    }

    labelypredhranyprve(model: PetriNet): void {
        for (const item of model.places) {
            this.canvas.add(item.objektymiesta.zamenom);
            this.canvas.add(item.objektymiesta.menoelem);

            this._modelService.sirkatextu = item.objektymiesta.menoelem.getComputedTextLength();
            item.objektymiesta.zamenom.setAttributeNS(null, 'x', item.place.x - this._modelService.sirkatextu / 2);
            item.objektymiesta.zamenom.setAttributeNS(null, 'width', this._modelService.sirkatextu);
            item.objektymiesta.menoelem.setAttributeNS(null, 'x', item.place.x - this._modelService.sirkatextu / 2);

        }
        for (const item of model.transitions) {
            this.canvas.add(item.objektyelementu.zamenom);
            this.canvas.add(item.objektyelementu.menoelem);
            if (item.objektyelementu.icon) {
                this.canvas.add(item.objektyelementu.icon);
            }

            this._modelService.sirkatextu = item.objektyelementu.menoelem.getComputedTextLength();

            item.objektyelementu.zamenom.setAttributeNS(null, 'x', item.transition.x - this._modelService.sirkatextu / 2);
            item.objektyelementu.zamenom.setAttributeNS(null, 'width', this._modelService.sirkatextu);
            item.objektyelementu.menoelem.setAttributeNS(null, 'x', item.transition.x - this._modelService.sirkatextu / 2);
        }
    }

    /**
     * PLACE
     */

    updatemarkings(): void {
        for (const item of this._modelService.graphicModel.places) {
            this.updatetokeny(item);
        }
    }

    updatetokeny(place: Place): void {
        if (place.place.marking >= 0 && place.place.marking <= 9) {
            place.markinglabel = '';
        } else {
            place.markinglabel = String(place.place.marking);
        }

        for (let i = 0; i < 9; i++) {
            (place.markingtokens[i] as Element).setAttributeNS(null, 'fill', Place.layouts[place.place.marking] !== undefined ? (Place.layouts[place.place.marking][i] === 1 ? 'black' : 'white') : 'white');
        }

        place.objektymiesta.markingnode.nodeValue = place.markinglabel;
        this._modelService.sirkatextu = place.objektymiesta.svgmarking.getComputedTextLength();
        place.objektymiesta.svgmarking.setAttributeNS(null, 'x', place.place.x - this._modelService.sirkatextu / 2);
    }

    novy_svg_place(place: Place, x: number, y: number, polomer: number): SvgPlace {
        const svgelement = document.createElementNS(CanvasService.svgNamespace, 'circle') as HTMLElement;

        svgelement.id = `svg_place_${place.place.id}`;
        svgelement.setAttributeNS(null, 'cx', x?.toString());
        svgelement.setAttributeNS(null, 'cy', y?.toString());
        svgelement.setAttributeNS(null, 'r', polomer?.toString());
        place.deactivate();
        this.canvas.add(svgelement);

        this.tokeny(place);

        const svgzamenom = document.createElementNS(CanvasService.svgNamespace, 'rect') as HTMLElement;
        svgzamenom.id = `svg_place_label_background_${place.place.id}`;
        svgzamenom.setAttributeNS(null, 'x', x?.toString());
        svgzamenom.setAttributeNS(null, 'y', String(y + polomer + ModelerConfig.FONTSIZE_OFFSET - this._modelService.korekcia));
        svgzamenom.setAttributeNS(null, 'width', String(0));
        svgzamenom.setAttributeNS(null, 'height', String(ModelerConfig.FONT_SIZE));
        svgzamenom.setAttributeNS(null, 'fill-opacity', '0.7');
        svgzamenom.setAttributeNS(null, 'fill', 'white');
        this.canvas.add(svgzamenom);

        const svgmeno = (document.createElementNS(CanvasService.svgNamespace, 'text') as unknown) as SVGTextContentElement;
        svgmeno.id = `svg_place_label_${place.place.id}`;
        svgmeno.setAttributeNS(null, 'x', x?.toString());
        svgmeno.setAttributeNS(null, 'y', (y + polomer + ModelerConfig.FONTSIZE_OFFSET)?.toString());
        svgmeno.setAttributeNS(null, 'font-size', String(ModelerConfig.FONT_SIZE));
        svgmeno.setAttributeNS(null, 'font-family', this._modelService.fontfamily);

        const labelnode = document.createTextNode(place.place.label?.value ?? '#' + place.place.id);
        svgmeno.appendChild(labelnode);
        this.canvas.add(svgmeno);
        this._modelService.sirkatextu = svgmeno.getComputedTextLength();

        svgzamenom.setAttributeNS(null, 'x', String(x - this._modelService.sirkatextu / 2));
        svgmeno.setAttributeNS(null, 'x', String(x - this._modelService.sirkatextu / 2));

        const svgmarking = (document.createElementNS(CanvasService.svgNamespace, 'text') as unknown) as SVGTextContentElement;
        svgmarking.id = `svg_place_marking_number_${place.place.id}`;
        svgmarking.setAttributeNS(null, 'x', x?.toString());
        svgmarking.setAttributeNS(null, 'y', (y + ModelerConfig.FONT_SIZE / 2)?.toString());
        svgmarking.setAttributeNS(null, 'font-size', String(ModelerConfig.FONT_SIZE));
        svgmarking.setAttributeNS(null, 'font-family', this._modelService.fontfamily);

        const markingnode = document.createTextNode(place.markinglabel);
        svgmarking.appendChild(markingnode);
        this.canvas.add(svgmarking);
        this._modelService.sirkatextu = svgmarking.getComputedTextLength();

        svgmarking.setAttributeNS(null, 'x', String(x - this._modelService.sirkatextu / 2));

        svgelement.onmouseover = svgmarking.onmouseover = svgmeno.onmouseover = () => {
            if (!this.isFireMode()) {
                place.activate();
            }
        };
        svgelement.onmouseout = svgmarking.onmouseout = svgmeno.onmouseout = () => {
            if (!this.isFireMode()) {
                place.deactivate();
            }
        };
        svgelement.onmousedown = svgmarking.onmousedown = (ev) => {
            this.onplacedown(place, svgelement, svgmeno, labelnode, svgmarking, markingnode, svgzamenom, ev);
        };

        for (const markToken of place.markingtokens) {
            // @ts-ignore
            markToken.onmouseover = () => {
                if (!this.isFireMode()) {
                    place.activate();
                }
            };
            // @ts-ignore
            markToken.onmouseout = () => {
                if (!this.isFireMode()) {
                    place.deactivate();
                }
            };
            // @ts-ignore
            markToken.onmousedown = (ev) => {
                this.onplacedown(place, svgelement, svgmeno, labelnode, svgmarking, markingnode, svgzamenom, ev);
            };
        }
        svgmeno.onmousedown = () => {
            if (this._modelService.whichButton.getValue() === 'label') {
                const label = prompt('Please enter place label', place.place.label?.value);
                if (label != null) {
                    if (place.place.label === undefined) {
                        place.place.label = new I18nString(label);
                    } else {
                        place.place.label.value = label;
                    }
                    labelnode.nodeValue = place.place.label.value;
                    this._modelService.sirkatextu = svgmeno.getComputedTextLength();
                    svgzamenom.setAttributeNS(null, 'x', String(place.place.x - this._modelService.sirkatextu / 2));
                    svgzamenom.setAttributeNS(null, 'width', String(this._modelService.sirkatextu));
                    svgmeno.setAttributeNS(null, 'x', String(place.place.x - this._modelService.sirkatextu / 2));
                }
            }
        };

        return new SvgPlace(svgelement, svgmeno, labelnode, svgmarking, markingnode, svgzamenom);
    }

    onplacedown(place: Place, svgelement: Element, svgmeno: SVGTextContentElement, labelnode: Text,
                svgmarking: SVGTextContentElement, markingnode: Text, svgzamenom: Element, mouseEvent: MouseEvent): void {
        if (this._modelService.whichButton.getValue() === 'delete') {
            const arcsWithRef = this._modelService.model.getArcs().filter(arc => arc.reference === place.place.id);
            if (arcsWithRef.length > 0) {
                const dialogRef = this._dialog.open(DialogPlaceRefDeleteComponent, {
                    data: {
                        place,
                        arcs: arcsWithRef
                    } as PlaceRefDeleteData
                });
                dialogRef.afterClosed().subscribe(result => {
                    if (result === true) {
                        this.deletePlace(place, svgelement, svgzamenom, svgmeno, labelnode, svgmarking, markingnode);
                        this.renderModel(this._modelService.model);
                    }
                });
            } else {
                this.deletePlace(place, svgelement, svgzamenom, svgmeno, labelnode, svgmarking, markingnode);
            }
        } else if (this.isCustomFastPn.getValue() && this._modelService.movedmiesto?.place?.id !== place.place.id && this._modelService.hybesamiesto === 1) {
            const currentArcIndex = this._modelService.model.getArcs().length - 1;
            const currentArc = this._modelService.model.getArcs()[currentArcIndex];
            currentArc.destination = place.place.id;
            this._modelService.movedmiesto = undefined;
            this._modelService.hybesamiesto = 0;
            this._modelService.pocetmousedownposuvplace = 0;
            const petriflowPlace = this._modelService.model.getPlaces()[this._modelService.model.getPlaces().length - 1];
            this._modelService.model.removePlace(petriflowPlace.id);
            const placeIndex = this._modelService.graphicModel.places.findIndex(p => p.place.id === petriflowPlace.id);
            this._modelService.graphicModel.places.splice(placeIndex, 1);
            this.renderModel(this._modelService.model);
            this.isActiveFastPn.next(true);
            this.hasBeenDone = true;
            this.fastPnService.placeToTransition(place);
        } else if (this._modelService.whichButton.getValue() === 'arc' || this._modelService.whichButton.getValue() === 'resetarc' ||
            this._modelService.whichButton.getValue() === 'inhibitorarc' || this._modelService.whichButton.getValue() === 'readarc') {
            if (this._modelService.kresli_sa_hrana === 0) {
                this._modelService.source_hrany = place;
                this._modelService.kresli_sa_hrana = 1;
                this._modelService.bod.x = place.place.x + ModelerConfig.ARROW_HEAD_SIZE; // event.pageX - canvas.getBoundingClientRect().left;
                this._modelService.bod.y = place.place.y; // event.pageY - canvas.getBoundingClientRect().top;
                this._modelService.hranabymove = this.novy_svg_temp_arc(place, this._modelService.bod, this.resolveArcType(this._modelService.whichButton.getValue()));
            } else if (this._modelService.whichButton.getValue() === 'arc') {
                if (this._modelService.source_hrany instanceof Transition) {
                    const nextIndex = this._modelService.graphicModel.arcs.length;
                    const arc = new PetriflowArc(this._modelService.source_hrany.transition.id, place.place.id, ArcType.REGULAR, 'a' + this._modelService.nextArcId());
                    this._modelService.model.addArc(arc);
                    this._modelService.graphicModel.arcs[nextIndex] = new Arc(arc, this.resolveArcSource(arc), this.resolveArcDestination(arc));
                    this.renderArc(this._modelService.graphicModel.arcs[nextIndex] as Arc);
                    this.elementypredhrany(this._modelService.graphicModel);
                    this.labelypredhranyprve(this._modelService.graphicModel);
                    this.isActiveArcModeFromPlace(place);
                }
            }
        } else if (this._modelService.whichButton.getValue() === 'label') {
            this._modelService.updatePreviousState();
            const label = prompt('Please enter place label', place.place.label?.value);
            if (label != null) {
                if (place.place.label === undefined) {
                    place.place.label = new I18nString(label);
                } else {
                    place.place.label.value = label;
                }
                labelnode.nodeValue = place.place.label?.value;
                this._modelService.sirkatextu = svgmeno.getComputedTextLength();
                svgzamenom.setAttributeNS(null, 'x', (place.place.x - this._modelService.sirkatextu / 2).toString());
                svgzamenom.setAttributeNS(null, 'width', this._modelService.sirkatextu?.toString());
                svgmeno.setAttributeNS(null, 'x', (place.place.x - this._modelService.sirkatextu / 2).toString());
                this.updatePlaceRefVahuHrany();
            }
        } else if (this._modelService.whichButton.getValue() === 'marking') {
            this._modelService.updatePreviousState();
            this.updatemarkingsvg(place);
            this.updatePlaceRefVahuHrany();
        } else if (this._modelService.whichButton.getValue() === 'addtoken') {
            this._modelService.updatePreviousState();
            place.place.marking++;
            this.updatetokeny(place);
            this.updatePlaceRefVahuHrany();
        } else if (this._modelService.whichButton.getValue() === 'removetoken') {
            this._modelService.updatePreviousState();
            if (place.place.marking > 0) {
                place.place.marking--;
                this.updatetokeny(place);
                this.updatePlaceRefVahuHrany();
            }
        } else if (this._modelService.whichButton.getValue() === 'position') {
            let doit = false;
            let novex = place.place.x;
            let novey = place.place.y;
            const a = prompt('Please enter x-coordinate of the place (not smaller than ' + ModelerConfig.COORDINATES_OFFSET +
                ' and not greater than ' + ModelerConfig.MAX_X + ' ):', (place.place.x)?.toString());
            if (a != null) {
                const x = parseInt(a, 10);
                if (isNaN(x)) {
                    alert('x is not a number');
                } else {
                    if (x <= ModelerConfig.COORDINATES_OFFSET || ModelerConfig.MAX_X <= x) {
                        alert('x is out of dimension');
                    } else {
                        novex = x;
                        doit = true;
                    }
                }
            }

            const b = prompt('Please enter y-coordinate of the place (not smaller than ' +
                ModelerConfig.COORDINATES_OFFSET + ' and not greater than ' + ModelerConfig.MAX_Y + ' ):', (place.place.y)?.toString());
            if (b != null) {
                const y = parseInt(b, 10);
                if (isNaN(y)) {
                    alert('y is not a number');
                } else {
                    if (y <= ModelerConfig.COORDINATES_OFFSET || ModelerConfig.MAX_Y <= y) {
                        alert('y is out of dimension');
                    } else {
                        novey = y;
                        doit = true;
                    }
                }
            }

            if (doit) {
                this.movemiesto(place, novex, novey);
            }
        } else if (this._modelService.whichButton.getValue() === 'move') {
            if (this._modelService.hybesamiesto === 0 && this._modelService.hybesaprechod !== 1) {
                this._modelService.hybesamiesto = 1;
                this._modelService.movedmiesto = place;
            }
        } else if (this._modelService.whichButton.getValue() === 'arc_placeref' && this.hranaForPlaceref !== undefined) {
            this.attachPlaceToArc(place.place);
            this.hranaForPlaceref.deactivate();
            this.hranaForPlaceref = undefined;
        } else if (this.isCustomFastPn.getValue()) {
            this.isActiveFastPn.next(true);
            this.hasBeenDone = true;
            this.fastPnService.placeToTransition(place);
        }
    }

    private deletePlace(place: Place, svgelement: Element, svgzamenom: Element, svgmeno: SVGTextContentElement, labelnode: Text, svgmarking: SVGTextContentElement, markingnode: Text) {
        this._modelService.updatePreviousState();
        this.removeElementArcs(place, place.place.id);
        this.canvas.remove(svgelement);
        this.canvas.remove(svgzamenom);
        svgmeno.removeChild(labelnode);
        this.canvas.remove(svgmeno);
        for (const token of place.markingtokens) {
            this.canvas.remove(token);
        }
        svgmarking.removeChild(markingnode);
        this.canvas.remove(svgmarking);

        this._modelService.model.removePlace(place.place.id);
        this._modelService.model.getArcs().filter(arc => arc.reference === place.place.id).forEach(arc => {
            arc.reference = undefined;
            arc.multiplicity = 1;
        });
        const j = this._modelService.graphicModel.places.indexOf(place);
        this._modelService.graphicModel.places.splice(j, 1);
    }

    private isActiveArcModeFromPlace(place: Place) {
        if (this.fastPnService.actualMode === FastPnMode.ARC) {
            this._modelService.whichButton.next('arc');
            this.fastPnService.placeToTransition(place);
            this.fastPnService.actualMode = undefined;
            this.isActiveFastPn.next(true);
        }
    }

    movemiesto(miesto: Place, x: number, y: number): void {
        miesto.place.x = x;
        miesto.place.y = y;

        miesto.objektymiesta.element.setAttributeNS(null, 'cx', x);
        miesto.objektymiesta.element.setAttributeNS(null, 'cy', y);
        miesto.objektymiesta.element.setAttributeNS(null, 'stroke', 'red');

        this._modelService.sirkatextu = miesto.objektymiesta.menoelem.getComputedTextLength();

        miesto.objektymiesta.zamenom.setAttributeNS(null, 'x', x - this._modelService.sirkatextu / 2);
        miesto.objektymiesta.zamenom.setAttributeNS(null, 'y', y + ModelerConfig.RADIUS + ModelerConfig.FONTSIZE_OFFSET - this._modelService.korekcia);

        miesto.objektymiesta.menoelem.setAttributeNS(null, 'x', x - this._modelService.sirkatextu / 2);
        miesto.objektymiesta.menoelem.setAttributeNS(null, 'y', y + ModelerConfig.RADIUS + ModelerConfig.FONTSIZE_OFFSET);

        this.updatepositionmarking(miesto);

        this._modelService.sirkatextu = miesto.objektymiesta.svgmarking.getComputedTextLength();
        miesto.objektymiesta.svgmarking.setAttributeNS(null, 'x', x - this._modelService.sirkatextu / 2);
        miesto.objektymiesta.svgmarking.setAttributeNS(null, 'y', y + ModelerConfig.FONT_SIZE / 2);

        for (const arc of this._modelService.graphicModel.arcs) {
            if (miesto.place.id === arc.arc.source || miesto.place.id === arc.arc.destination) {
                this.updatehranusvg(arc);
            }
        }
    }

    updatepositionmarking(place: Place): void {
        const x = place.place.x;
        const y = place.place.y;

        place.markingtokens[0].setAttributeNS(null, 'cx', x.toString());
        place.markingtokens[0].setAttributeNS(null, 'cy', y.toString());

        place.markingtokens[1].setAttributeNS(null, 'cx', (x + ModelerConfig.TOKEN_OFFSET).toString());
        place.markingtokens[1].setAttributeNS(null, 'cy', (y + ModelerConfig.TOKEN_OFFSET).toString());

        place.markingtokens[2].setAttributeNS(null, 'cx', (x - ModelerConfig.TOKEN_OFFSET).toString());
        place.markingtokens[2].setAttributeNS(null, 'cy', (y + ModelerConfig.TOKEN_OFFSET).toString());

        place.markingtokens[3].setAttributeNS(null, 'cx', (x + ModelerConfig.TOKEN_OFFSET).toString());
        place.markingtokens[3].setAttributeNS(null, 'cy', (y - ModelerConfig.TOKEN_OFFSET).toString());

        place.markingtokens[4].setAttributeNS(null, 'cx', (x - ModelerConfig.TOKEN_OFFSET).toString());
        place.markingtokens[4].setAttributeNS(null, 'cy', (y - ModelerConfig.TOKEN_OFFSET).toString());

        place.markingtokens[5].setAttributeNS(null, 'cx', (x - ModelerConfig.TOKEN_OFFSET).toString());
        place.markingtokens[5].setAttributeNS(null, 'cy', y.toString());

        place.markingtokens[6].setAttributeNS(null, 'cx', (x + ModelerConfig.TOKEN_OFFSET).toString());
        place.markingtokens[6].setAttributeNS(null, 'cy', y.toString());

        place.markingtokens[7].setAttributeNS(null, 'cx', x.toString());
        place.markingtokens[7].setAttributeNS(null, 'cy', (y - ModelerConfig.TOKEN_OFFSET).toString());

        place.markingtokens[8].setAttributeNS(null, 'cx', x.toString());
        place.markingtokens[8].setAttributeNS(null, 'cy', (y + ModelerConfig.TOKEN_OFFSET).toString());
    }

    tokeny(place: Place): void {
        const x = place.place.x;
        const y = place.place.y;
        const offsets = [[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let i = 0; i < 9; i++) {
            const offset = offsets[i];
            place.markingtokens[i] = document.createElementNS(CanvasService.svgNamespace, 'circle');
            place.markingtokens[i].id = `svg_place_marking_token_${i}_${place.place.id}`;
            place.markingtokens[i].setAttributeNS(null, 'cx', (x + offset[0] * ModelerConfig.TOKEN_OFFSET).toString());
            place.markingtokens[i].setAttributeNS(null, 'cy', (y + offset[1] * ModelerConfig.TOKEN_OFFSET).toString());
            place.markingtokens[i].setAttributeNS(null, 'r', (ModelerConfig.TOKEN_RADIUS).toString());
            place.markingtokens[i].setAttributeNS(null, 'fill', 'white');
            this.canvas.add(place.markingtokens[i]);
        }
    }

    updatemarkingsvg(place: Place): void {
        place.objektymiesta.markingnode.nodeValue = place.markinglabel;
        let marking = place.place.marking;
        const zadane = prompt('Please enter a nonnegative place marking', place.place.marking.toString());

        if (zadane != null) {
            marking = parseInt(zadane, 10);
            if (isNaN(marking)) {
                alert('Not a number');
            }

            if (marking < 0) {
                alert('Negative number');
            }

            if (!isNaN(marking) && marking >= 0) {
                place.place.marking = marking;
                this.updatetokeny(place);
            }
        }
    }

    renderIcon(t: Transition): void {
        const icon = document.createElementNS(CanvasService.svgNamespace, 'text') as HTMLElement;
        icon.setAttributeNS(null, 'x', String(t.transition.x - ModelerConfig.ICON_SIZE / 2));
        icon.setAttributeNS(null, 'y', String(t.transition.y + ModelerConfig.ICON_SIZE / 2));
        icon.setAttributeNS(null, 'style', `font-family: Material Icons;font-size: ${ModelerConfig.ICON_SIZE}px`);
        icon.appendChild(document.createTextNode(t.transition.icon));
        this.canvas.add(icon);
        icon.onmouseover = t.objektyelementu.element.onmouseover;
        icon.onmouseout = t.objektyelementu.element.onmouseout;
        icon.onmousedown = t.objektyelementu.element.onmousedown;
        icon.oncontextmenu = t.objektyelementu.element.oncontextmenu;
        t.objektyelementu.icon = icon;
    }

    novy_svg_transition(transition: Transition, x: number, y: number, velkost: number): SvgTransition {
        const cancelArrow = document.createElementNS(CanvasService.svgNamespace, 'polygon') as HTMLElement;
        cancelArrow.id = `svg_transition_start_${transition.transition.id}`;
        cancelArrow.setAttributeNS(null, 'points', this.bodycancelsipky(x, y));
        cancelArrow.setAttributeNS(null, 'fill', 'white');
        cancelArrow.setAttributeNS(null, 'stroke', 'white');
        cancelArrow.setAttributeNS(null, 'stroke-width', '2');

        const finishArrow = document.createElementNS(CanvasService.svgNamespace, 'polygon') as HTMLElement;
        finishArrow.id = `svg_transition_finish_${transition.transition.id}`;
        finishArrow.setAttributeNS(null, 'points', this.bodyfinishsipky(x, y));
        finishArrow.setAttributeNS(null, 'fill', 'white');
        finishArrow.setAttributeNS(null, 'stroke', 'white');
        finishArrow.setAttributeNS(null, 'stroke-width', '2');

        const element = document.createElementNS(CanvasService.svgNamespace, 'rect') as HTMLElement;
        element.id = `svg_transition_${transition.transition.id}`;
        element.setAttributeNS(null, 'x', String(x - velkost / 2));
        element.setAttributeNS(null, 'y', String(y - velkost / 2));
        element.setAttributeNS(null, 'width', String(velkost));
        element.setAttributeNS(null, 'height', String(velkost));
        transition.deactivate();
        this.canvas.add(element);
        this.canvas.add(finishArrow);
        this.canvas.add(cancelArrow);

        const zamenom = document.createElementNS(CanvasService.svgNamespace, 'rect') as HTMLElement;
        zamenom.id = `svg_transition_label_background_${transition.transition.id}`;
        zamenom.setAttributeNS(null, 'x', String(x));
        zamenom.setAttributeNS(null, 'y', String(y + velkost / 2 + ModelerConfig.FONTSIZE_OFFSET - this._modelService.korekcia));
        zamenom.setAttributeNS(null, 'width', String(0));
        zamenom.setAttributeNS(null, 'height', String(ModelerConfig.FONT_SIZE));
        zamenom.setAttributeNS(null, 'fill-opacity', '0.7');
        zamenom.setAttributeNS(null, 'fill', 'white');
        this.canvas.add(zamenom);

        const menoelem = (document.createElementNS(CanvasService.svgNamespace, 'text') as unknown) as SVGTextContentElement;
        menoelem.id = `svg_transition_label_${transition.transition.id}`;
        menoelem.setAttributeNS(null, 'x', String(x));
        menoelem.setAttributeNS(null, 'y', String(y + velkost / 2 + ModelerConfig.FONTSIZE_OFFSET));
        menoelem.setAttributeNS(null, 'font-size', String(ModelerConfig.FONT_SIZE));
        menoelem.setAttributeNS(null, 'font-family', this._modelService.fontfamily);
        const meno = document.createTextNode(transition.transition.label?.value ?? transition.transition.id);
        menoelem.appendChild(meno);
        this.canvas.add(menoelem);

        this._modelService.sirkatextu = menoelem.getComputedTextLength();

        zamenom.setAttributeNS(null, 'x', String(x - this._modelService.sirkatextu / 2));
        menoelem.setAttributeNS(null, 'x', String(x - this._modelService.sirkatextu / 2));

        element.onmouseover = menoelem.onmouseover = finishArrow.onmouseover = cancelArrow.onmouseover = () => {
            if (!this.isFireMode()) {
                transition.activate();
            }
        };
        element.onmouseout = menoelem.onmouseout = finishArrow.onmouseout = cancelArrow.onmouseout = () => {
            if (!this.isFireMode()) {
                transition.deactivate();
            }
        };

        element.onmousedown = this.transitionOnMouseDown(transition, () => {
            if (this._modelService.whichButton.getValue() === 'fire') {
                if (this.enabled(transition)) {
                    this.consume(transition);
                    this.produce(transition);
                    this.updatemarkings();
                    this.updatePlaceRefVahuHrany();
                    if (this._modelService.whichButton.getValue() === 'fire') {
                        for (const trans of this._modelService.graphicModel.transitions) {
                            if (this.enabled(trans)) {
                                trans.enable();
                            } else {
                                trans.disable();
                            }
                        }
                    }
                }
            }
        }, () => {
            if (this._modelService.whichButton.getValue() === 'fire-task') {
                if (this.enabled(transition) || transition.firing) {
                    if (!transition.firing) {
                        this.consume(transition);
                    }
                    this.updatemarkings();
                    this.updatePlaceRefVahuHrany();
                    if (this._modelService.whichButton.getValue() === 'fire-task') {
                        for (const trans of this._modelService.graphicModel.transitions) {
                            if (this.enabled(trans)) {
                                trans.enable();
                            } else {
                                trans.disable();
                            }
                        }
                    }
                }
            }
        });
        cancelArrow.onmousedown = this.transitionOnMouseDown(transition, () => {
        }, () => {
            if (this._modelService.whichButton.getValue() === 'fire-task') {
                if (this.enabled(transition) || transition.firing) {
                    if (transition.firing) {
                        this.cancel(transition);
                    } else {
                        this.consume(transition);
                    }
                    this.updatemarkings();
                    this.updatePlaceRefVahuHrany();
                    if (this._modelService.whichButton.getValue() === 'fire-task') {
                        for (const trans of this._modelService.graphicModel.transitions) {
                            if (this.enabled(trans)) {
                                trans.enable();
                            } else {
                                trans.disable();
                            }
                        }
                    }
                }
            }
        });

        finishArrow.onmousedown = this.transitionOnMouseDown(transition, () => {
        }, () => {
            if (this._modelService.whichButton.getValue() === 'fire-task') {
                if (this.enabled(transition) || transition.firing) {
                    if (transition.firing) {
                        this.produce(transition);
                    } else {
                        this.consume(transition);
                    }
                    this.updatemarkings();
                    this.updatePlaceRefVahuHrany();
                    if (this._modelService.whichButton.getValue() === 'fire-task') {
                        for (const trans of this._modelService.graphicModel.transitions) {
                            if (this.enabled(trans)) {
                                trans.enable();
                            } else {
                                trans.disable();
                            }
                        }
                    }
                }
            }
        });

        element.oncontextmenu = finishArrow.oncontextmenu = cancelArrow.oncontextmenu = (event) => {
            if (document.getElementById('ctxMenu') !== null) {
                const contextMenu = document.getElementById('ctxMenu');
                if (this.isActiveFastPn.getValue()) {
                    return;
                }
                const area = document.getElementById('modeler_area');
                const areaBounds = area.getBoundingClientRect();
                contextMenu.style.top = (((event.clientY + contextMenu.offsetHeight - areaBounds.y) > area.offsetHeight) ? (areaBounds.y + area.offsetHeight - contextMenu.offsetHeight) : (event.clientY)) + 'px';
                contextMenu.style.left = (((event.clientX + contextMenu.offsetWidth - areaBounds.x) > area.offsetWidth) ? (areaBounds.x + area.offsetWidth - contextMenu.offsetWidth) : (event.clientX)) + 'px';
                contextMenu.style.visibility = 'visible';
                contextMenu.style.opacity = '1';
                this.transitionService.id = transition.transition.id;
                if (document.getElementById('modelCtxMenu') !== null) {
                    document.getElementById('modelCtxMenu').style.visibility = 'hidden';
                }
                event.stopPropagation();
                event.preventDefault();
            }
        };

        menoelem.onmousedown = () => {
            if (this._modelService.whichButton.getValue() === 'label') {
                // this._modelService.previousStatus = this.exportService.generujXML(1);
                const label = prompt('Please enter transition label', transition.transition.label?.value);
                if (label != null) {
                    if (transition.transition.label === undefined) {
                        transition.transition.label = new I18nString(label);
                    } else {
                        transition.transition.label.value = label;
                    }
                    meno.nodeValue = transition.transition.label.value;
                    this._modelService.sirkatextu = menoelem.getComputedTextLength();
                    zamenom.setAttributeNS(null, 'x', String(transition.transition.x - this._modelService.sirkatextu / 2));
                    zamenom.setAttributeNS(null, 'width', String(this._modelService.sirkatextu));
                    menoelem.setAttributeNS(null, 'x', String(transition.transition.x - this._modelService.sirkatextu / 2));
                }
            }
        };

        return new SvgTransition(element, menoelem, meno, zamenom, finishArrow, cancelArrow);
    }

    moveprechod(prechod: Transition, x: number, y: number): void {
        prechod.transition.x = x;
        prechod.transition.y = y;
        prechod.objektyelementu.element.setAttributeNS(null, 'x', x - ModelerConfig.SIZE / 2);

        prechod.objektyelementu.element.setAttributeNS(null, 'y', y - ModelerConfig.SIZE / 2);
        prechod.objektyelementu.element.setAttributeNS(null, 'stroke', 'red');
        prechod.objektyelementu.cancelArrow.setAttributeNS(null, 'points', this.bodycancelsipky(x, y));
        prechod.objektyelementu.finishArrow.setAttributeNS(null, 'points', this.bodyfinishsipky(x, y));

        this._modelService.sirkatextu = prechod.objektyelementu.menoelem.getComputedTextLength();

        prechod.objektyelementu.zamenom.setAttributeNS(null, 'x', x - this._modelService.sirkatextu / 2);
        prechod.objektyelementu.zamenom.setAttributeNS(null, 'y', y + ModelerConfig.SIZE / 2 + ModelerConfig.FONTSIZE_OFFSET - this._modelService.korekcia);

        prechod.objektyelementu.menoelem.setAttributeNS(null, 'x', x - this._modelService.sirkatextu / 2);
        prechod.objektyelementu.menoelem.setAttributeNS(null, 'y', y + ModelerConfig.SIZE / 2 + ModelerConfig.FONTSIZE_OFFSET);

        if (prechod.objektyelementu.icon) {
            prechod.objektyelementu.icon.setAttributeNS(null, 'x', String(x - ModelerConfig.ICON_SIZE / 2));
            prechod.objektyelementu.icon.setAttributeNS(null, 'y', String(y + ModelerConfig.ICON_SIZE / 2));
            prechod.objektyelementu.icon.setAttributeNS(null, 'style', `font-family: Material Icons;font-size:${ModelerConfig.ICON_SIZE}`);
        }

        for (const arc of this._modelService.graphicModel.arcs) {
            if (prechod.transition.id === arc.arc.source || prechod.transition.id === arc.arc.destination) {
                this.updatehranusvg(arc);
            }
        }
    }

    enabled(t: Transition): boolean {
        for (const place of this._modelService.graphicModel.places) {
            place.testmarking = place.place.marking;
        }

        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.destination === t.transition.id && (arc.arc.type === ArcType.INHIBITOR) && (this._modelService.graphicModel.places.find(pl => arc.arc.source === pl.place.id)).testmarking >= arc.arc.multiplicity) {
                return false;
            }
        }

        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.destination === t.transition.id && (arc.arc.type === ArcType.READ) && ((this._modelService.graphicModel.places.find(pl => arc.arc.source === pl.place.id)).testmarking < arc.arc.multiplicity)) {
                return false;
            }
        }

        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.destination === t.transition.id && arc.arc.type === ArcType.REGULAR || arc.arc.destination === t.transition.id && arc.arc.type === ArcType.VARIABLE) {
                const place = this._modelService.graphicModel.places.find(pl => arc.arc.source === pl.place.id);
                place.testmarking = place.testmarking - arc.arc.multiplicity;
            }
        }

        for (const place of this._modelService.graphicModel.places) {
            if (place.testmarking < 0) {
                return false;
            }
        }

        return true;
    }

    consume(t: Transition): void {
        t.firing = true;
        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.destination === t.transition.id && (arc.arc.type === ArcType.REGULAR || arc.arc.destination === t.transition.id && arc.arc.type === ArcType.VARIABLE)) {
                const source = this._modelService.model.getPlace(arc.arc.source);
                source.marking -= arc.arc.multiplicity;
                arc.cancel = arc.arc.multiplicity;
            }
        }

        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.destination === t.transition.id && (arc.arc.type === ArcType.RESET)) {
                const source = this._modelService.model.getPlace(arc.arc.source);
                arc.cancel = source.marking;
                source.marking = 0;
            }
        }
    }

    produce(t: Transition): void {
        t.firing = false;
        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.source === t.transition.id) {
                const place = this._modelService.model.getPlace(arc.arc.destination);
                place.marking += arc.arc.multiplicity;
            }
        }
    }

    cancel(t: Transition): void {
        t.firing = false;
        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.destination === t.transition.id && (arc.arc.type === ArcType.REGULAR || arc.arc.type === ArcType.RESET)) {
                const place = this._modelService.model.getPlace(arc.arc.source);
                place.marking += arc.cancel;
                arc.cancel = 0;
            }
        }
    }

    doMouseMove(event: MouseEvent): void {
        let mysX = this.getMousePositionX(event);
        let mysY = this.getMousePositionY(event);
        let source: PetriflowPlace | PetriflowTransition;
        if (this._modelService.source_hrany instanceof Transition) {
            source = this._modelService.source_hrany.transition;
        } else if (this._modelService.source_hrany instanceof Place) {
            source = this._modelService.source_hrany.place;
        }
        let posun;

        if (this._modelService.kresli_sa_hrana === 1 && (this._modelService.whichButton.getValue() === 'arc' ||
            this._modelService.whichButton.getValue() === 'resetarc' || this._modelService.whichButton.getValue() === 'inhibitorarc' ||
            this._modelService.whichButton.getValue() === 'readarc')) {

            let nx;
            let ny;
            let start: Point;
            if (source instanceof Place) {
                posun = ModelerConfig.RADIUS + 2;
            } else {
                posun = ModelerConfig.SIZE / 2 + 2;
            }
            if (Math.abs(source.x - mysX) > posun || Math.abs(source.y - mysY) > posun) {
                if (source.x > mysX) {
                    mysX = mysX + 2;
                }
                if (source.x < mysX) {
                    mysX = mysX - 2;
                }
                if (source.y > mysY) {
                    mysY = mysY + 2;
                }
                if (source.y < mysY) {
                    mysY = mysY - 2;
                }
                const dummyEnd = new Point(mysX, mysY);
                const dx = dummyEnd.x - source.x;
                const dy = dummyEnd.y - source.y;
                const dlzkahrany = Math.sqrt(dx * dx + dy * dy);
                const dlzkaskratena = dlzkahrany - ModelerConfig.ARROW_HEAD_SIZE + 2;
                const pomer = dlzkaskratena / dlzkahrany;
                nx = source.x + dx * pomer;
                ny = source.y + dy * pomer;
                start = Arc.startPoint(source, dummyEnd);
                this._modelService.hranabymove.polyciara.setAttributeNS(null, 'points', start.x + ',' + start.y + ' ' + nx + ',' + ny);
                if (this._modelService.whichButton.getValue() === 'inhibitorarc' || this._modelService.whichButton.getValue() === 'readarc') {
                    this._modelService.hranabymove.sipka.setAttributeNS(null, 'cx', this.bodInhibitorSipky(start.x, start.y, mysX, mysY).x);
                    this._modelService.hranabymove.sipka.setAttributeNS(null, 'cy', this.bodInhibitorSipky(start.x, start.y, mysX, mysY).y);
                } else {
                    this._modelService.hranabymove.sipka.setAttributeNS(null, 'points', this.bodySipky(start.x, start.y, mysX, mysY, this._modelService.hranabymove.arctype));
                }
            }
        }

        if (this._modelService.posuva_sa_hrana === 1 && this._modelService.whichButton.getValue() === 'move') {
            this._modelService.posuvanahrana.linePoints[this._modelService.indexbodu].x = mysX;
            this._modelService.posuvanahrana.linePoints[this._modelService.indexbodu].y = mysY;
            this._modelService.posuvanahrana.updateBreakpoints();

            this.updatehranusvg(this._modelService.posuvanahrana);
        }

        if (this._modelService.hybesaprechod === 1 && this._modelService.whichButton.getValue() === 'move') {
            this.moveprechod(this._modelService.movedprechod, mysX, mysY);
        }

        if (this._modelService.hybesamiesto === 1 && this._modelService.whichButton.getValue() === 'move') {
            this.movemiesto(this._modelService.movedmiesto, mysX, mysY);
        }
    }

    korekcia_x(x: number) {
        let xx = x;
        if (xx < ModelerConfig.COORDINATES_OFFSET) {
            xx = ModelerConfig.COORDINATES_OFFSET;
        }

        if (xx > this._modelService.appwidth - ModelerConfig.COORDINATES_OFFSET) {
            xx = this._modelService.appwidth - ModelerConfig.COORDINATES_OFFSET;
        }

        return xx;
    }

    korekcia_y(y: number) {
        let yy = y;
        if (yy < ModelerConfig.COORDINATES_OFFSET) {
            yy = ModelerConfig.COORDINATES_OFFSET;
        }

        if (yy > this._modelService.appheight - ModelerConfig.COORDINATES_OFFSET) {
            yy = this._modelService.appheight - ModelerConfig.COORDINATES_OFFSET;
        }

        return yy;
    }

    doMouseDown(event: MouseEvent): void {
        if (event.button === 0) {
            if (document.getElementById('ctxMenu') && document.getElementById('modelCtxMenu') &&
                (document.getElementById('ctxMenu').style.visibility === 'visible' || document.getElementById('modelCtxMenu').style.visibility === 'visible' || document.getElementById('fastPnContextMenu')?.style.visibility === 'visible')) {
                document.getElementById('ctxMenu').style.visibility = 'hidden';
                document.getElementById('modelCtxMenu').style.visibility = 'hidden';
                if (document.getElementById('fastPnContextMenu') != null) {
                    document.getElementById('fastPnContextMenu').style.visibility = 'hidden';
                }
            } else {
                let mysX = this.getMousePositionX(event);
                let mysY = this.getMousePositionY(event);

                mysX = this.korekcia_x(mysX);
                mysY = this.korekcia_y(mysY);

                if (this._modelService.kresli_sa_hrana === 1) {
                    this._modelService.pocetmousedown++;
                    if (!(this._modelService.pocetmousedown === 2 && this._modelService.kresli_sa_hrana === 1)) {
                        this._modelService.updatePreviousState();
                    }
                }
                if (this._modelService.pocetmousedown === 2 && this._modelService.kresli_sa_hrana === 1) {
                    this.canvas.remove(this._modelService.hranabymove.polyciara);
                    this.canvas.remove(this._modelService.hranabymove.sipka);
                    this._modelService.pocetmousedown = 0;
                    this._modelService.kresli_sa_hrana = 0;
                }

                if (this._modelService.posuva_sa_hrana === 1) {
                    this._modelService.pocetmousedownposuv++;
                    if (!(this._modelService.pocetmousedownposuv === 2 && this._modelService.posuva_sa_hrana === 1)) {
                        this._modelService.updatePreviousState();
                    }
                }
                if (this._modelService.pocetmousedownposuv === 2 && this._modelService.posuva_sa_hrana === 1) {
                    this._modelService.posuvanahrana.linePoints[this._modelService.indexbodu].x = mysX;
                    this._modelService.posuvanahrana.linePoints[this._modelService.indexbodu].y = mysY;
                    this._modelService.pocetmousedownposuv = 0;
                    this._modelService.posuva_sa_hrana = 0;
                    this.updatehranusvg(this._modelService.posuvanahrana);
                }
                if (this._modelService.hybesaprechod === 1) {
                    this._modelService.pocetmousedownposuvtran++;
                    if (!(this._modelService.pocetmousedownposuvtran === 2 && this._modelService.hybesaprechod === 1)) {
                        this._modelService.updatePreviousState();
                    }
                    if (this._modelService.pocetmousedownposuvtran === 1 && this.isActiveFastPn.value && !this.afterContextClose ||
                        this._modelService.pocetmousedownposuvtran === 2 && this.isActiveFastPn.value && this.afterContextClose) {
                        this._modelService.pocetmousedownposuvtran = 0;
                        this._modelService.hybesaprechod = 0;
                        if (!this.hasBeenDone) {
                            this.fastPnService.transitionToPlace(this._modelService.movedprechod);
                        } else {
                            this.reset();
                            this._modelService.hybesamiesto = 0;
                            this._modelService.hybesaprechod = 1;
                            this._modelService.movedprechod = this.fastPnService.lastElement as Transition;
                            this.fastPnService.controlPanelComponent.getValue().resetFast('move');
                            this.hasBeenDone = false;
                        }
                        if (this.afterContextClose) {
                            this.afterContextClose = false;
                        }
                    }
                }

                if (this._modelService.pocetmousedownposuvtran === 2 && this._modelService.hybesaprechod === 1) {
                    this._modelService.pocetmousedownposuvtran = 0;
                    this._modelService.hybesaprechod = 0;
                    this.moveprechod(this._modelService.movedprechod, mysX, mysY);
                    this._modelService.movedprechod.activate();
                }

                if (this._modelService.hybesamiesto === 1) {
                    this._modelService.pocetmousedownposuvplace++;
                    if (!(this._modelService.pocetmousedownposuvplace === 2 && this._modelService.hybesamiesto === 1)) {
                        this._modelService.updatePreviousState();
                    }
                    if ((this._modelService.pocetmousedownposuvplace === 2 && this.isActiveFastPn.value) || this.hasBeenDone === true) {
                        this._modelService.pocetmousedownposuvplace = 0;
                        this._modelService.hybesamiesto = 0;
                        if (!this.hasBeenDone) {
                            this.fastPnService.placeToTransition(this._modelService.movedmiesto);
                        } else {
                            this.reset();
                            this._modelService.hybesamiesto = 1;
                            this._modelService.hybesaprechod = 0;
                            this._modelService.movedmiesto = this.fastPnService.lastElement as Place;
                            this.fastPnService.controlPanelComponent.getValue().resetFast('move');
                            this._modelService.pocetmousedownposuvplace = 1;
                            this.hasBeenDone = false;
                        }
                    }
                }

                if (this._modelService.pocetmousedownposuvplace === 2 && this._modelService.hybesamiesto === 1) {
                    this._modelService.pocetmousedownposuvplace = 0;
                    this._modelService.hybesamiesto = 0;
                    this.movemiesto(this._modelService.movedmiesto, mysX, mysY);
                    this._modelService.movedmiesto.activate();
                }

                if (this._modelService.whichButton.getValue() === 'transition') {
                    this._modelService.updatePreviousState();
                    const trans = new PetriflowTransition(mysX, mysY, 't' + this._modelService.nextTransitionId());
                    this._modelService.model.addTransition(trans);
                    const modelTrans = new Transition(trans, []);
                    this._modelService.graphicModel.transitions.push(modelTrans);
                    this.renderTransition(modelTrans);
                    this.elementypredhrany(this._modelService.graphicModel);
                    this.labelypredhranyprve(this._modelService.graphicModel);
                }

                if (this._modelService.whichButton.getValue() === 'place' || this._modelService.whichButton.getValue() === 'staticplace') {
                    this._modelService.updatePreviousState();
                    const place = new PetriflowPlace(mysX, mysY, this._modelService.whichButton.getValue() === 'staticplace', 'p' + this._modelService.nextPlaceId());
                    if (this._modelService.model.getPlaces().length === 0 && ModelerConfig.INITIALISE_PLACE) {
                        place.marking = 1;
                    }
                    this._modelService.model.addPlace(place);
                    const modelPlace = new Place(place);
                    this._modelService.graphicModel.places.push(modelPlace);
                    this.renderPlace(modelPlace);
                    this.elementypredhrany(this._modelService.graphicModel);
                    this.labelypredhranyprve(this._modelService.graphicModel);
                    if (this.isActiveFastPn.getValue()) {
                        this.fastPnService.placeToTransition(modelPlace);
                    }
                }

                if (this._modelService.whichButton.getValue() === 'arc_placeref' && this.hranaForPlaceref !== undefined) {
                    if (this.hranaForPlacerefClicked) {
                        this.hranaForPlacerefClicked = false;
                    } else {
                        this.hranaForPlaceref.deactivate();
                        this.hranaForPlaceref = undefined;
                    }
                }
            }
            this._modelService.pocetmousedownright = 0;
        } else if (event.button === 2 && this.isActiveFastPn.getValue() || this.fastPnService.actualMode === 'arc') {
            this._modelService.pocetmousedownright++;
            if (this._modelService.pocetmousedownright === 2) {
                this.fastPnService.endFastPn();
            }
        }
    }

    undo(): void {
        // TODO: use event sourcing
        // if (this._modelService.previousStatus != null) {
        //   this.importService.importFromXml(this.importService.parseXml(this._modelService.previousStatus));
        //   this._modelService.previousStatus = null;
        // }
    }

    deleteAll(): void {
        this.canvas.removeAll();
        this._modelService.resetId();
    }

    /**
     * GUI
     */

    clearmodel(): void {
        if (this._modelService.model.getPlaces().length > 0 || this._modelService.model.getTransitions().length > 0) {
            const c = confirm('Are you sure to clear? Any unsaved changes will be lost.');
            if (c) {
                this.deleteModel();
                // TODO document.getElementById('menofilu').innerHTML = this._modelService.menofilu;
            }
        } else {
            this.deleteModel();
            // TODO document.getElementById('menofilu').innerHTML = this._modelService.menofilu;
        }
    }

    deleteModel(): void {
        this.deleteAll();
        this._modelService.menofilu = 'newmodel.xml';
        this._modelService.model = new PetriflowPetriNet();
        this._modelService.graphicModel = new PetriNet(this._modelService.model);
        this._modelService.model.title = new I18nString('New Model');
        this._modelService.model.icon = 'home';
        this._modelService.model.version = '1.0.0';
        this._modelService.model.id = 'new_model';
        this._modelService.model.initials = 'NEW';
        this.model.next(this._modelService.model);
    }

    setDimension(): void {
        let doit = false;
        const a = prompt('Please enter width (min width is ' + ModelerConfig.MIN_WIDTH + ', max width is ' +
            ModelerConfig.MAX_WIDTH + '):', String(this._modelService.appwidth));
        if (a != null) {
            const x = parseInt(a, 10);
            if (isNaN(x)) {
                alert('x is not a number');
            } else {
                if (x < ModelerConfig.MIN_WIDTH || ModelerConfig.MAX_WIDTH < x) { // || y < minheight || maxheight < y
                    alert('x is out of dimension');
                } else {
                    this._modelService.appwidth = x;
                    doit = true;
                }
            }
        }
        const b = prompt('Please enter height (min height is ' + ModelerConfig.MIN_HEIGHT + ', max height is ' +
            ModelerConfig.MAX_HEIGHT + ':', String(this._modelService.appheight));
        if (b != null) {
            const y = parseInt(b, 10);
            if (isNaN(y)) {
                alert('y is not a number');
            } else {
                if (y < ModelerConfig.MIN_HEIGHT || ModelerConfig.MAX_HEIGHT < y) {
                    alert('y is out of dimension');
                } else {
                    this._modelService.appheight = y;
                    doit = true;
                }
            }
        }

        if (doit) {
            this.canvas.resize(this._modelService.appwidth, this._modelService.appheight);
        }
    }

    alignElements(): void {
        for (const t of this._modelService.graphicModel.transitions) {
            let x = t.transition.x;
            x = this.korekcia_x(Math.floor(x / ModelerConfig.GRID_STEP) * ModelerConfig.GRID_STEP + ModelerConfig.GRID_STEP / 2);
            let y = t.transition.y;
            y = this.korekcia_y(Math.floor(y / ModelerConfig.GRID_STEP) * ModelerConfig.GRID_STEP + ModelerConfig.GRID_STEP / 2);
            this.moveprechod(t, x, y);
            t.deactivate();
        }

        for (const place of this._modelService.graphicModel.places) {
            let x = place.place.x;
            x = this.korekcia_x(Math.floor(x / ModelerConfig.GRID_STEP) * ModelerConfig.GRID_STEP + ModelerConfig.GRID_STEP / 2);
            let y = place.place.y;
            y = this.korekcia_y(Math.floor(y / ModelerConfig.GRID_STEP) * ModelerConfig.GRID_STEP + ModelerConfig.GRID_STEP / 2);
            this.movemiesto(place, x, y);
            place.deactivate();
        }

        for (const arc of this._modelService.graphicModel.arcs) {
            for (const bodHrany of arc.linePoints) {
                const x = bodHrany.x;
                bodHrany.x = this.korekcia_x(Math.floor(x / ModelerConfig.GRID_STEP) * ModelerConfig.GRID_STEP + ModelerConfig.GRID_STEP / 2);
                const y = bodHrany.y;
                bodHrany.y = this.korekcia_y(Math.floor(y / ModelerConfig.GRID_STEP) * ModelerConfig.GRID_STEP + ModelerConfig.GRID_STEP / 2);
            }
            arc.updateBreakpoints();
            this.updatehranusvg(arc);
        }

        this.reset();
    }

    propertiesM(): void {
        const spolu = this._modelService.model.getPlaces().length + this._modelService.model.getTransitions().length + this._modelService.model.getArcs().length;
        alert('Number of places: ' + this._modelService.model.getPlaces().length + '\nNumber of transitions: ' + this._modelService.model.getTransitions().length +
            '\nNumber of arcs: ' + this._modelService.model.getArcs().length + '\nNumber of elements: ' + spolu);
    }

    about(): void {
        alert('Copyright © 2021 NETGRIF, s.r.o.');
    }

    getMousePositionY(event: MouseEvent): number {
        if (ModelerConfig.VERTICAL_OFFSET === undefined) {
            return event.offsetY;
        }
        return event.offsetY - ModelerConfig.VERTICAL_OFFSET;
    }

    getMousePositionX(event: MouseEvent): number {
        if (ModelerConfig.HORIZONTAL_OFFSET === undefined) {
            return event.offsetX;
        }
        return event.offsetX - ModelerConfig.HORIZONTAL_OFFSET;
    }

    deletePlaceReferenceData(arcId: string): void {
        const arc = this._modelService.graphicModel.arcs.find(it => it.arc.id === arcId);
        if (arc !== undefined) {
            arc.arc.reference = undefined;
            arc.arc.multiplicity = 1;
            arc.multiplicityLabel = '';
            arc.objektyhrany.vaha.nodeValue = (arc as Arc).multiplicityLabel;
            this.updatehranusvg(arc);
        }
    }

    deleteArcReferenceData(arcId: string): void {
        const arc = this._modelService.graphicModel.arcs.find(it => it.arc.id === arcId);
        if (arc !== undefined) {
            arc.arc.reference = undefined;
            arc.arc.multiplicity = 1;
            (arc as Arc).multiplicityLabel = '';
            (arc as Arc).objektyhrany.vaha.nodeValue = (arc as Arc).multiplicityLabel;
            this.updatehranusvg(arc);
        }
    }

    attachDataToArc(data: DataVariable): void {

        const vaha = parseInt(this._modelService.model.getData(data.id).init.expression, 10);

        if (isNaN(vaha)) {
            alert('Not a number. Cannot change the value of arc weight.');
        }
        if (vaha < 0) {
            alert('A negative number. Cannot change the value of arc weight.');
        }

        if (!isNaN(vaha) && vaha >= 0) {

            this._modelService.graphicModel.arcForData.arc.multiplicity = vaha;

            const varname = parseInt(this._modelService.model.getData(data.id).title.value, 10);
            if (!isNaN(varname)) {
                alert('Warning. Variable name starts with a number. Apostrophes added.');
            }
            if (!this._modelService.model.getData(data.id).title.value.replace(/\s/g, '').length) {
                alert('Warning. Variable name only contains whitespaces. Apostrophes added.');
            }

            if (!isNaN(varname) || !this._modelService.model.getData(data.id).title.value.replace(/\s/g, '').length) {
                this._modelService.graphicModel.arcForData.multiplicityLabel = `"${this._modelService.model.getData(data.id).title.value}"`;
            } else {
                this._modelService.graphicModel.arcForData.multiplicityLabel = this._modelService.model.getData(data.id).title.value;
            }
            this._modelService.graphicModel.arcForData.arc.reference = this._modelService.model.getData(data.id).id;

            this._modelService.graphicModel.arcForData.objektyhrany.vaha.nodeValue = `${this._modelService.graphicModel.arcForData.multiplicityLabel} (${vaha})`;
            this.updatehranusvg(this._modelService.graphicModel.arcForData);

        }
    }

    attachPlaceToArc(place: PetriflowPlace): void {
        const vaha = place.marking;

        if (isNaN(vaha)) {
            alert('Not a number. Cannot change the value of arc weight.');
            return;
        }
        if (vaha < 0) {
            alert('A negative number. Cannot change the value of arc weight.');
            return;
        }

        this.hranaForPlaceref.arc.multiplicity = vaha;

        const varname = parseInt(place.label?.value ?? '', 10);
        if (!isNaN(varname)) {
            alert('Warning. Place label starts with a number. Apostrophes added.');
        }
        if (!place.label?.value?.replace(/\s/g, '')?.length) {
            alert('Warning. Place label only contains whitespaces. Apostrophes added.');
        }

        if (!isNaN(varname) || !place.label?.value?.replace(/\s/g, '')?.length) {
            this.hranaForPlaceref.multiplicityLabel = '"' + (place.label?.value ?? '') + '"';
        } else {
            this.hranaForPlaceref.multiplicityLabel = place.label.value;
        }
        this.hranaForPlaceref.arc.reference = place.id;

        this.hranaForPlaceref.objektyhrany.vaha.nodeValue = `${this.hranaForPlaceref.multiplicityLabel} (${vaha})`;
        this.updatehranusvg(this.hranaForPlaceref);
    }

    set editSideNav(value: MatSidenav) {
        this._editSideNav = value;
    }

    bodycancelsipky(x: number, y: number): string {
        const x1 = x - 0.1 * ModelerConfig.SIZE / 2;
        const y1 = y - 0.8 * ModelerConfig.SIZE / 2;
        const x2 = x - 0.1 * ModelerConfig.SIZE / 2;
        const y2 = y + 0.8 * ModelerConfig.SIZE / 2;
        const x3 = x - 0.85 * ModelerConfig.SIZE / 2;
        return x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x3 + ',' + y + ' ';
    }

    bodyfinishsipky(x: number, y: number): string {
        const x1 = x + 0.1 * ModelerConfig.SIZE / 2;
        const y1 = y - 0.8 * ModelerConfig.SIZE / 2;
        const x2 = x + 0.1 * ModelerConfig.SIZE / 2;
        const y2 = y + 0.8 * ModelerConfig.SIZE / 2;
        const x3 = x + 0.85 * ModelerConfig.SIZE / 2;
        return x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x3 + ',' + y + ' ';
    }

    isFireMode(): boolean {
        return this._fireModes.includes(this._modelService.whichButton.getValue());
    }

    transitionOnMouseDown(transition: Transition, onFireMode, onTaskFireMode) {
        return (event) => {
            if (event.button === 0) {
                if (this._modelService.whichButton.getValue() === 'select' && !this.isCustomFastPn.getValue()) {
                    this.selectedTransition.next(transition);
                    this._editSideNav.open();
                } else if (this._modelService.whichButton.getValue() === 'delete') {
                    this.removeElementArcs(transition, transition.transition.id);

                    this.canvas.remove(transition.objektyelementu.element);
                    this.canvas.remove(transition.objektyelementu.zamenom);
                    this.canvas.remove(transition.objektyelementu.cancelArrow);
                    this.canvas.remove(transition.objektyelementu.finishArrow);
                    if (transition.objektyelementu.icon) {
                        this.canvas.remove(transition.objektyelementu.icon);
                    }

                    transition.objektyelementu.menoelem.removeChild(transition.objektyelementu.meno);
                    this.canvas.remove(transition.objektyelementu.menoelem);
                    const j = this._modelService.graphicModel.transitions.indexOf(transition);
                    this._modelService.graphicModel.transitions.splice(j, 1);
                    this._modelService.model.removeTransition(transition.transition.id);
                } else if (this.isCustomFastPn.getValue() && this._modelService.movedprechod?.transition.id !== transition.transition.id && this._modelService.hybesaprechod === 1) {
                    const currentArcIndex = this._modelService.model.getArcs().length - 1;
                    const currentArc = this._modelService.model.getArcs()[currentArcIndex];
                    currentArc.destination = transition.transition.id;
                    const petriflowTransition = this._modelService.model.getTransitions()[this._modelService.model.getTransitions().length - 1];
                    this._modelService.model.removeTransition(petriflowTransition.id);
                    const transitionIndex = this._modelService.graphicModel.transitions.findIndex(t => t.transition.id === petriflowTransition.id);
                    this._modelService.graphicModel.transitions.splice(transitionIndex, 1);
                    this.renderModel(this._modelService.model);
                    this._modelService.movedprechod = undefined;
                    this._modelService.hybesaprechod = 0;
                    this._modelService.pocetmousedownposuvtran = 0;
                    this.isActiveFastPn.next(true);
                    this.hasBeenDone = true;
                    this.fastPnService.transitionToPlace(transition);
                } else if (this._modelService.whichButton.getValue() === 'arc' || this._modelService.whichButton.getValue() === 'resetarc' ||
                    this._modelService.whichButton.getValue() === 'inhibitorarc' || this._modelService.whichButton.getValue() === 'readarc') {
                    if (this._modelService.kresli_sa_hrana === 0 && this._modelService.whichButton.getValue() === 'arc') {
                        this._modelService.source_hrany = transition;
                        this._modelService.kresli_sa_hrana = 1;
                        this._modelService.bod.x = transition.transition.x + ModelerConfig.ARROW_HEAD_SIZE; // event.pageX - HORIZONTAL_OFFSET;
                        this._modelService.bod.y = transition.transition.y; // event.pageY - VERTICAL_OFFSET;
                        this._modelService.hranabymove = this.novy_svg_temp_arc(transition, this._modelService.bod, ArcType.REGULAR);
                    } else {
                        if (this._modelService.kresli_sa_hrana !== 0 && !(this._modelService.source_hrany instanceof Transition)) {
                            const nextIndex = this._modelService.model.getArcs().length;
                            const arc = new PetriflowArc(this._modelService.source_hrany.place.id, transition.transition.id,
                                this.resolveArcType(this._modelService.whichButton.getValue()), 'a' + this._modelService.nextArcId());
                            this._modelService.model.addArc(arc);
                            this._modelService.graphicModel.arcs[nextIndex] = new Arc(arc, this.resolveArcSource(arc), this.resolveArcDestination(arc));
                            this.renderArc(this._modelService.graphicModel.arcs[nextIndex]);
                            this.elementypredhrany(this._modelService.graphicModel);
                            this.labelypredhranyprve(this._modelService.graphicModel);
                            this.isActiveArcMode(transition);
                        }
                    }
                } else if (this._modelService.whichButton.getValue() === 'position') {
                    let doit = false;
                    let novex = transition.transition.x;
                    let novey = transition.transition.y;
                    const a = prompt('Please enter x-coordinate of the transition (not smaller than ' +
                        ModelerConfig.COORDINATES_OFFSET + ' and not greater than ' + ModelerConfig.MAX_X + ' ):', transition.stringX);
                    if (a != null) {
                        const xx = parseInt(a, 10);
                        if (isNaN(xx)) {
                            alert('x is not a number');
                        } else {
                            if (xx <= ModelerConfig.COORDINATES_OFFSET || ModelerConfig.MAX_X <= xx) {
                                alert('x is out of dimension');
                            } else {
                                novex = xx;
                                doit = true;
                            }
                        }
                    }
                    const b = prompt('Please enter y-coordinate of the transition (not smaller than ' +
                        ModelerConfig.COORDINATES_OFFSET + ' and not greater than ' + ModelerConfig.MAX_Y + ' ):', transition.stringY);
                    if (b != null) {
                        const yy = parseInt(b, 10);
                        if (isNaN(yy)) {
                            alert('y is not a number');
                        } else {
                            if (yy <= ModelerConfig.COORDINATES_OFFSET || ModelerConfig.MAX_Y <= yy) {
                                alert('y is out of dimension');
                            } else {
                                novey = yy;
                                doit = true;
                            }
                        }
                    }
                    if (doit) {
                        this.moveprechod(transition, novex, novey);
                    }
                } else if (this._modelService.whichButton.getValue() === 'move') {
                    if (this._modelService.hybesaprechod === 0 && this._modelService.hybesamiesto !== 1) {
                        this._modelService.hybesaprechod = 1;
                        this._modelService.movedprechod = transition;
                    }
                } else if (this._modelService.whichButton.getValue() === 'label') {
                    this._modelService.updatePreviousState();
                    const label = prompt('Please enter transition label', transition.transition.label?.value);
                    if (label != null) {
                        if (transition.transition.label === undefined) {
                            transition.transition.label = new I18nString(label);
                        } else {
                            transition.transition.label.value = label;
                        }
                        transition.objektyelementu.meno.nodeValue = transition.transition.label.value;
                        this._modelService.sirkatextu = transition.objektyelementu.menoelem.getComputedTextLength();
                        transition.objektyelementu.zamenom.setAttributeNS(null, 'x', String(transition.transition.x - this._modelService.sirkatextu / 2));
                        transition.objektyelementu.zamenom.setAttributeNS(null, 'width', String(this._modelService.sirkatextu));
                        transition.objektyelementu.menoelem.setAttributeNS(null, 'x', String(transition.transition.x - this._modelService.sirkatextu / 2));
                    }
                } else if (this._modelService.whichButton.getValue() === 'arc_placeref' && this.hranaForPlaceref !== undefined) {
                    alert('It is not possible to choose transition as reference');
                    this.hranaForPlaceref.deactivate();
                    this.hranaForPlaceref = undefined;
                } else if (this.isCustomFastPn.getValue()) {
                    this.isActiveFastPn.next(true);
                    this.hasBeenDone = true;
                    this._modelService.hybesamiesto = 1;
                    this.fastPnService.transitionToPlace(transition);
                }

                onFireMode();
                onTaskFireMode();
            }
        };
    }

    removeElementArcs(element: Place | Transition, id: string) {
        for (let i = 0; i < this._modelService.graphicModel.arcs.length; i++) {
            const graphicArc = this._modelService.graphicModel.arcs[i];
            if (id === graphicArc.arc.source || id === graphicArc.arc.destination) {
                this.canvas.remove(graphicArc.objektyhrany.polyciarapod);
                this.canvas.remove(graphicArc.objektyhrany.polyciara);
                this.canvas.remove(graphicArc.objektyhrany.sipka);
                graphicArc.objektyhrany.vahaelem.removeChild(graphicArc.objektyhrany.vaha);
                this.canvas.remove(graphicArc.objektyhrany.vahaelem);
                this._modelService.graphicModel.arcs.splice(i, 1);
                this._modelService.model.removeArc(graphicArc.arc.id);
                i--;
            }
        }
    }

    private isActiveArcMode(transition: Transition) {
        if (this.fastPnService.actualMode === FastPnMode.ARC) {
            this._modelService.whichButton.next('arc');
            this.fastPnService.transitionToPlace(transition);
            this.fastPnService.actualMode = undefined;
            this.isActiveFastPn.next(true);
        }
    }

    private openAttachDialog(element: Arc): void {
        this._modelService.graphicModel.arcForData = element;
        const dialogRef = this._dialog.open(DialogArcAttachComponent, {
            width: '75%',
            data: element
        });

        dialogRef.afterClosed().subscribe(dataVariable => {
            if (dataVariable === undefined) {
                if (this._modelService.graphicModel.arcForData.arc.reference) {
                    this.deleteArcReferenceData(element.arc.id);
                }
            } else {
                this.attachDataToArc(dataVariable);
            }
            this._modelService.graphicModel.arcForData = undefined;
        });
    }

    updatePlaceRefVahuHrany(): void {
        for (const arc of this._modelService.graphicModel.arcs) {
            if (arc.arc.reference) {
                const ref = this._modelService.model.getPlace(arc.arc.reference);
                if (ref === undefined) {
                    continue;
                }
                arc.arc.multiplicity = ref.marking;
                (arc as Arc).objektyhrany.vaha.nodeValue = `${ref.label.value === '' ? '""' : ref.label.value} ${'(' + arc.arc.multiplicity + ')'}`;
            }
        }
    }

    updateDataRefVahuHrany(): void {
        for (const arc of this._modelService.model.getArcs()) {
            if (arc.reference !== undefined) {
                const ref = this._modelService.model.getData(arc.reference);
                if (ref === undefined) {
                    continue;
                }
                const vaha = parseInt(ref.init.expression, 10);
                if (isNaN(vaha)) {
                    alert('Not a number. Cannot change the value of arc weight. Dataref - ' + ref.id);
                }
                if (vaha < 0) {
                    alert('A negative number. Cannot change the value of arc weight. Dataref - ' + ref.id);
                }
                if (!isNaN(vaha) && vaha >= 0) {
                    arc.multiplicity = vaha;
                }
            }
        }
    }

    private resolveArcType(value: string): ArcType {
        switch (value) {
            case 'arc':
                return ArcType.REGULAR;
            case 'resetarc':
                return ArcType.RESET;
            case 'inhibitorarc':
                return ArcType.INHIBITOR;
            case 'readarc':
                return ArcType.READ;
        }
    }

    private resolveArcSource(arc: Arc | PetriflowArc): PetriflowPlace | PetriflowTransition {
        const a = arc instanceof Arc ? arc.arc : arc;
        return this._modelService.model.getPlace(a.source) ?? this._modelService.model.getTransition(a.source);
    }

    private resolveArcDestination(arc: Arc | PetriflowArc): PetriflowPlace | PetriflowTransition {
        const a = arc instanceof Arc ? arc.arc : arc;
        return this._modelService.model.getPlace(a.destination) ?? this._modelService.model.getTransition(a.destination);
    }
}
