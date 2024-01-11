import {Tool} from '../../control-panel/tools/tool';
import {MouseListener} from './listeners/mouse-listener';
import {PlaceListener} from './listeners/place-listener';
import {TransitionListener} from './listeners/transition-listener';
import {ArcListener} from './listeners/arc-listener';
import {ModelService} from '../model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {CanvasPlace} from '../../edit-mode/domain/canvas-place';
import {CanvasTransition} from '../../edit-mode/domain/canvas-transition';
import {CanvasArc} from '../../edit-mode/domain/canvas-arc';
import {PetriflowCanvas, PetriflowCanvasService} from '@netgrif/petriflow.svg';
import {PetriNet} from '@netgrif/petriflow';
import {CanvasElementCollection} from '../../edit-mode/domain/canvas-element-collection';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../selected-transition.service';
import {ComponentType} from '@angular/cdk/overlay';

export abstract class CanvasListenerTool extends Tool implements MouseListener, PlaceListener, TransitionListener, ArcListener {

    private readonly _modelService: ModelService;
    private readonly _dialog: MatDialog;
    private readonly _router: Router;
    private readonly _transitionService: SelectedTransitionService;

    protected constructor(
        id: string,
        button: ControlPanelButton,
        modelService: ModelService,
        dialog: MatDialog,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(id, button);
        this._modelService = modelService;
        this._dialog = dialog;
        this._router = router;
        this._transitionService = transitionService;
    }

    abstract get canvasService(): PetriflowCanvasService;

    abstract get elements(): CanvasElementCollection;

    abstract reset(): void;

    public bind(): void {
        this.bindPlaces(this.elements?.places);
        this.bindTransitions(this.elements?.transitions);
        this.bindArcs(this.elements?.arcs);
        this.bindCanvas(this.canvas);
    }

    public unbind(): void {
        if (!this.elements) {
            return;
        }
        this.unbindPlaces(this.elements.places);
        this.unbindTransitions(this.elements.transitions);
        this.unbindArcs(this.elements.arcs);
        this.unbindCanvas(this.canvas);
    }

    bindPlaces(places: Array<CanvasPlace>): void {
        places.forEach(place => this.bindPlace(place));
    }

    bindPlace(place: CanvasPlace): void {
        place.svgPlace.canvasElement.container.onpointerdown = (e) => this.onPlaceDown(e, place);
        place.svgPlace.canvasElement.container.onpointerup = (e) => this.onPlaceUp(e, place);
        place.svgPlace.canvasElement.container.onclick = (e) => this.onPlaceClick(e, place);
        place.svgPlace.canvasElement.container.ondblclick = (e) => this.onPlaceDoubleClick(e, place);
        place.svgPlace.canvasElement.container.onpointerenter = (e) => this.onPlaceEnter(e, place);
        place.svgPlace.canvasElement.container.onpointerleave = (e) => this.onPlaceLeave(e, place);
        place.svgPlace.canvasElement.container.onpointermove = (e) => this.onPlaceMove(e, place);
        place.svgPlace.canvasElement.container.oncontextmenu = (e) => this.onPlaceContextMenu(e, place);
    }

    unbindPlaces(places: Array<CanvasPlace>): void {
        places.forEach(place => this.unbindPlace(place));
    }

    unbindPlace(place: CanvasPlace): void {
        place.svgPlace.canvasElement.container.onpointerdown = undefined;
        place.svgPlace.canvasElement.container.onpointerup = undefined;
        place.svgPlace.canvasElement.container.onclick = undefined;
        place.svgPlace.canvasElement.container.ondblclick = undefined;
        place.svgPlace.canvasElement.container.onpointerenter = undefined;
        place.svgPlace.canvasElement.container.onpointerleave = undefined;
        place.svgPlace.canvasElement.container.onpointermove = undefined;
        place.svgPlace.canvasElement.container.oncontextmenu = undefined;
    }

    bindTransitions(transitions: Array<CanvasTransition>): void {
        transitions.forEach(transition => this.bindTransition(transition));
    }

    bindTransition(transition: CanvasTransition): void {
        transition.svgTransition.canvasElement.container.onpointerdown = (e) => this.onTransitionDown(e, transition);
        transition.svgTransition.canvasElement.container.onpointerup = (e) => this.onTransitionUp(e, transition);
        transition.svgTransition.canvasElement.container.onclick = (e) => this.onTransitionClick(e, transition);
        transition.svgTransition.canvasElement.container.ondblclick = (e) => this.onTransitionDoubleClick(e, transition);
        transition.svgTransition.canvasElement.container.onpointerenter = (e) => this.onTransitionEnter(e, transition);
        transition.svgTransition.canvasElement.container.onpointerleave = (e) => this.onTransitionLeave(e, transition);
        transition.svgTransition.canvasElement.container.onpointermove = (e) => this.onTransitionMove(e, transition);
        transition.svgTransition.canvasElement.container.oncontextmenu = (e) => this.onTransitionContextMenu(e, transition);
    }

    unbindTransitions(transitions: Array<CanvasTransition>): void {
        transitions.forEach(transition => this.unbindTransition(transition));
    }

    unbindTransition(transition: CanvasTransition): void {
        transition.svgTransition.canvasElement.container.onpointerdown = undefined;
        transition.svgTransition.canvasElement.container.onpointerup = undefined;
        transition.svgTransition.canvasElement.container.onclick = undefined;
        transition.svgTransition.canvasElement.container.ondblclick = undefined;
        transition.svgTransition.canvasElement.container.onpointerenter = undefined;
        transition.svgTransition.canvasElement.container.onpointerleave = undefined;
        transition.svgTransition.canvasElement.container.onpointermove = undefined;
        transition.svgTransition.canvasElement.container.oncontextmenu = undefined;
    }

    bindArcs(arcs: Array<CanvasArc>): void {
        arcs.forEach(arc => this.bindArc(arc));
    }

    bindArc(arc: CanvasArc): void {
        arc.svgArc.element.container.onpointerdown = (e) => this.onArcDown(e, arc);
        arc.svgArc.element.container.onpointerup = (e) => this.onArcUp(e, arc);
        arc.svgArc.element.container.onclick = (e) => this.onArcClick(e, arc);
        arc.svgArc.element.container.ondblclick = (e) => this.onArcDoubleClick(e, arc);
        arc.svgArc.element.container.onpointerenter = (e) => this.onArcEnter(e, arc);
        arc.svgArc.element.container.onpointerleave = (e) => this.onArcLeave(e, arc);
        arc.svgArc.element.container.onpointermove = (e) => this.onArcMove(e, arc);
        arc.svgArc.element.container.oncontextmenu = (e) => this.onArcContextMenu(e, arc);
    }

    unbindArcs(arcs: Array<CanvasArc>): void {
        arcs.forEach(arc => this.unbindArc(arc));
    }

    unbindArc(arc: CanvasArc): void {
        arc.svgArc.element.container.onpointerdown = undefined;
        arc.svgArc.element.container.onpointerup = undefined;
        arc.svgArc.element.container.onclick = undefined;
        arc.svgArc.element.container.ondblclick = undefined;
        arc.svgArc.element.container.onpointerenter = undefined;
        arc.svgArc.element.container.onpointerleave = undefined;
        arc.svgArc.element.container.onpointermove = undefined;
        arc.svgArc.element.container.oncontextmenu = undefined;
    }

    private bindCanvas(canvas: PetriflowCanvas): void {
        if (!canvas?.svg) {
            return;
        }
        canvas.svg.onpointerdown = (e) => this.onMouseDown(e);
        canvas.svg.onpointerup = (e) => this.onMouseUp(e);
        canvas.svg.onclick = (e) => this.onMouseClick(e);
        canvas.svg.ondblclick = (e) => this.onMouseDoubleClick(e);
        canvas.svg.onpointerenter = (e) => this.onMouseEnter(e);
        canvas.svg.onpointerleave = (e) => this.onMouseLeave(e);
        canvas.svg.onpointermove = (e) => this.onMouseMove(e);
        canvas.svg.oncontextmenu = (e) => this.onContextMenu(e);
    }

    private unbindCanvas(canvas: PetriflowCanvas): void {
        if (!canvas?.svg) {
            return;
        }
        canvas.svg.onpointerdown = undefined;
        canvas.svg.onpointerup = undefined;
        canvas.svg.onclick = undefined;
        canvas.svg.ondblclick = undefined;
        canvas.svg.onpointerenter = undefined;
        canvas.svg.onpointerleave = undefined;
        canvas.svg.onpointermove = undefined;
        canvas.svg.oncontextmenu = undefined;
    }

    onMouseClick(event: MouseEvent): void {
    }

    onMouseDoubleClick(event: MouseEvent): void {
    }

    onMouseDown(event: MouseEvent): void {
        this.checkPanning(event);
    }

    onMouseEnter(event: MouseEvent): void {
    }

    onMouseLeave(event: MouseEvent): void {
    }

    onMouseMove(event: MouseEvent): void {
    }

    onMouseOut(event: MouseEvent): void {
    }

    onMouseOver(event: MouseEvent): void {
    }

    onMouseUp(event: MouseEvent): void {
        this.checkPanning(event);
    }

    onContextMenu(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onArcClick(event: MouseEvent, arc: CanvasArc): void {
    }

    onArcDoubleClick(event: MouseEvent, arc: CanvasArc): void {
    }

    onArcDown(event: MouseEvent, arc: CanvasArc): void {
    }

    onArcEnter(event: MouseEvent, arc: CanvasArc): void {
        arc.svgArc.activate();
    }

    onArcLeave(event: MouseEvent, arc: CanvasArc): void {
        arc.svgArc.deselect();
    }

    onArcMove(event: MouseEvent, arc: CanvasArc): void {
    }

    onArcUp(event: MouseEvent, arc: CanvasArc): void {
    }

    onArcContextMenu(event: MouseEvent, arc: CanvasArc): void {
        event.preventDefault();
        event.stopPropagation();
        // TODO: release/4.0.0 open context menu
    }

    onPlaceClick(event: MouseEvent, place: CanvasPlace): void {
    }

    onPlaceDoubleClick(event: MouseEvent, place: CanvasPlace): void {
    }

    onPlaceDown(event: MouseEvent, place: CanvasPlace): void {
    }

    onPlaceEnter(event: MouseEvent, place: CanvasPlace): void {
        place.svgPlace.activate();
    }

    onPlaceLeave(event: MouseEvent, place: CanvasPlace): void {
        place.svgPlace.deactivate();
    }

    onPlaceMove(event: MouseEvent, place: CanvasPlace): void {
    }

    onPlaceUp(event: MouseEvent, place: CanvasPlace): void {
    }

    onPlaceContextMenu(event: MouseEvent, place: CanvasPlace): void {
        event.preventDefault();
        event.stopPropagation();
        // TODO: release/4.0.0 context menu
    }

    onTransitionClick(event: MouseEvent, transition: CanvasTransition): void {
    }

    onTransitionDoubleClick(event: MouseEvent, transition: CanvasTransition): void {
    }

    onTransitionDown(event: MouseEvent, transition: CanvasTransition): void {
    }

    onTransitionEnter(event: MouseEvent, transition: CanvasTransition): void {
        transition.svgTransition.activate();
    }

    onTransitionLeave(event: MouseEvent, transition: CanvasTransition): void {
        transition.svgTransition.deactivate();
    }

    onTransitionMove(event: MouseEvent, transition: CanvasTransition): void {
    }

    onTransitionUp(event: MouseEvent, transition: CanvasTransition): void {
    }

    onTransitionContextMenu(event: MouseEvent, transition: CanvasTransition): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onClick(): void {
    }

    openDialog(dialog: ComponentType<any>, config: any, afterClose: (value: any) => void): void {
        this.dialog.open(dialog, config).afterClosed().subscribe(afterClose);
    }

    checkPanning(event: MouseEvent): void {
        if (this.isLeftButton(event)) {
            this.canvasService.disablePanning();
        } else {
            this.canvasService.enablePanning();
        }
    }

    isLeftButton(event: MouseEvent): boolean {
        return event.button === 0 || (event.button === -1 && event.buttons === 1);
    }

    isWheelButton(event: MouseEvent): boolean {
        return event.button === 1;
    }

    isRightButton(event: MouseEvent): boolean {
        return event.button === 2 || (event.button === -1 && event.buttons === 2);
    }

    mousePosition(event: MouseEvent): DOMPoint {
        return new DOMPoint(event.offsetX, event.offsetY);
    }

    windowMousePosition(event: MouseEvent): DOMPoint {
        return new DOMPoint(event.clientX, event.clientY);
    }

    public get modelService(): ModelService {
        return this._modelService;
    }

    public get model(): PetriNet {
        return this._modelService.model;
    }

    public get dialog(): MatDialog {
        return this._dialog;
    }

    get canvas(): PetriflowCanvas {
        return this.canvasService.canvas;
    }

    get router(): Router {
        return this._router;
    }

    get transitionService(): SelectedTransitionService {
        return this._transitionService;
    }
}
