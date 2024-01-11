import {CanvasTool} from './canvas-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {CanvasPlace} from '../../domain/canvas-place';
import {CanvasTransition} from '../../domain/canvas-transition';
import {
    NodeElement as SvgNodeElement,
    RegularPlaceTransitionArc as SvgRegularPlaceTransitionArc,
    RegularTransitionPlaceArc as SvgRegularTransitionPlaceArc
} from '@netgrif/petri.svg';
import {CanvasArc} from '../../domain/canvas-arc';
import {NodeElement} from '@netgrif/petriflow';
import {PetriflowNode} from '@netgrif/petriflow.svg';
import {CanvasNodeElement} from '../../domain/canvas-node-element';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {ModelService} from '../../../services/model/model.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';

enum Step {
    PLACE,
    TRANSITION,
}

export class QuickDrawTool extends CanvasTool {

    public static readonly ID = 'QuickDrawTool';

    // TODO: NAB-326 remove step,determine based on source and arcline
    private _step: Step;
    private source: CanvasNodeElement<NodeElement, PetriflowNode<SvgNodeElement>>;
    private arcLine: SVGElement;

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            QuickDrawTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('bolt'),
                'Fast PN',
            ),
            modelService,
            dialog,
            editModeService,
            router,
            transitionService
        );
    }

    isWorkInProgress(): boolean {
        return this.arcLine !== undefined;
    }

    bind() {
        super.bind();
        this.step = Step.PLACE;
    }

    unbind() {
        super.unbind();
        this.editModeService.elements.places.forEach(p => p.svgPlace.deactivate());
        this.editModeService.elements.transitions.forEach(t => t.svgTransition.deactivate());
    }

    onArcClick(event: MouseEvent, arc: CanvasArc) {
        event.stopPropagation();
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            return;
        }
        super.onArcClick(event, arc);
        if (this.source) {
            event.stopPropagation();
            return;
        }
    }

    onArcContextMenu(event: MouseEvent, arc: CanvasArc) {
        event.stopPropagation();
        event.preventDefault();
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            return;
        }
        if (this.isWorkInProgress()) {
            this.reset();
            return;
        }
        super.onArcContextMenu(event, arc);
    }

    onPlaceClick(event: MouseEvent, canvasPlace: CanvasPlace) {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            event.stopPropagation();
            return;
        }
        super.onPlaceClick(event, canvasPlace);
        event.stopPropagation();
        if (this.step === Step.PLACE) {
            if (this.source) {
                const canvasArc = this.editModeService.createNewRegularTransitionPlaceArc(this.source as CanvasTransition, canvasPlace);
                this.editModeService.removeTemporaryArc(this.arcLine);
                this.bindArc(canvasArc);
            }
            this.source = canvasPlace;
            this.arcLine = this.editModeService.createTemporaryArc(canvasPlace.svgPlace.getPosition(), this.getMarkerId());
            this.nextStep();
        }
    }

    onPlaceContextMenu(event: MouseEvent, place: CanvasPlace) {
        event.stopPropagation();
        event.preventDefault();
        if (this.isWorkInProgress()) {
            this.reset();
            return;
        }
        super.onPlaceContextMenu(event, place);
    }

    onTransitionClick(event: MouseEvent, canvasTransition: CanvasTransition) {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            event.stopPropagation();
            return;
        }
        super.onTransitionClick(event, canvasTransition);
        event.stopPropagation();
        if (this.step === Step.PLACE && this.source) {
            return;
        }
        if (this.step === Step.TRANSITION && this.source) {
            const canvasArc = this.editModeService.createNewRegularPlaceTransitionArc(this.source as CanvasPlace, canvasTransition);
            this.editModeService.removeTemporaryArc(this.arcLine);
            this.bindArc(canvasArc);
        }
        this.source = canvasTransition;
        this.arcLine = this.editModeService.createTemporaryArc(canvasTransition.svgTransition.getPosition(), this.getMarkerId());
        this.step = Step.PLACE;
    }

    onTransitionContextMenu(event: MouseEvent, transition: CanvasTransition) {
        event.stopPropagation();
        event.preventDefault();
        if (this.isWorkInProgress()) {
            this.reset();
            return;
        }
        super.onTransitionContextMenu(event, transition);
    }

    onMouseClick(event: MouseEvent) {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            event.stopPropagation();
            return;
        }
        super.onMouseClick(event);
        if (this.step === Step.PLACE) {
            const canvasPlace = this.editModeService.createPlace(this.mousePosition(event));
            this.bindPlace(canvasPlace);
            this.onPlaceClick(event, canvasPlace);
        } else if (this.step === Step.TRANSITION) {
            const canvasTransition = this.editModeService.createTransition(this.mousePosition(event));
            this.bindTransition(canvasTransition);
            this.onTransitionClick(event, canvasTransition);
        }
    }

    onContextMenu(event: MouseEvent) {
        super.onContextMenu(event);
        this.reset();
    }

    onMouseMove(event: MouseEvent) {
        if (!this.arcLine) {
            return;
        }
        this.editModeService.moveTemporaryArc(this.arcLine, this.mousePosition(event), this.source.svgElement);
    }

    getMarkerId(): string {
        return this.step === Step.PLACE ? SvgRegularPlaceTransitionArc.ID : SvgRegularTransitionPlaceArc.ID;
    }

    reset(): void {
        if (this.arcLine) {
            this.canvas.container.removeChild(this.arcLine);
        }
        this.arcLine = undefined;
        this.source = undefined;
        this.step = Step.PLACE;
        this.editModeService.elements.places.forEach(p => p.svgPlace.deactivate());
        this.editModeService.elements.transitions.forEach(t => t.svgTransition.deactivate());
    }

    set step(value: Step) {
        this._step = value;
        if (this.step === Step.PLACE) {
            this.editModeService.elements.places.forEach(p => p.svgPlace.activate());
            this.editModeService.elements.transitions.forEach(t => t.svgTransition.deactivate());
        } else {
            this.editModeService.elements.places.forEach(p => p.svgPlace.deactivate());
            this.editModeService.elements.transitions.forEach(t => t.svgTransition.activate());
        }
    }

    get step(): Step {
        return this._step;
    }

    private nextStep(): void {
        this.step = this.step === Step.PLACE ? Step.TRANSITION : Step.PLACE;
    }
}
