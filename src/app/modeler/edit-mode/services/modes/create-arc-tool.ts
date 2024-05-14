import {CanvasNodeElement} from '../../domain/canvas-node-element';
import {ArcType, NodeElement} from '@netgrif/petriflow';
import {NodeElement as SvgNodeElement} from '@netgrif/petri.svg'
import {PetriflowNode} from '@netgrif/petriflow.svg';
import {CanvasTool} from './canvas-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {CanvasArc} from '../../domain/canvas-arc';
import {CanvasPlace} from '../../domain/canvas-place';
import {CanvasTransition} from '../../domain/canvas-transition';
import {absoluteFrom} from '@angular/compiler-cli';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';

export abstract class CreateArcTool<T extends CanvasNodeElement<NodeElement, PetriflowNode<SvgNodeElement>>> extends CanvasTool {

    private _source: T;
    private _arcLine: SVGElement;

    constructor(_id: string, button: ControlPanelButton, modelService: ModelService, dialog: MatDialog,
                editModeService: EditModeService, router: Router, transitionService: SelectedTransitionService,
                actionMode: ActionsModeService, actionsMasterDetail: ActionsMasterDetailService) {
        super(_id, button, modelService, dialog, editModeService, router, transitionService, actionMode, actionsMasterDetail);
    }

    abstract startDrawingArc(node: CanvasPlace | CanvasTransition): void;

    abstract finishDrawingArc(createArcFunction: () => CanvasArc): void;

    isWorkInProgress(): boolean {
        return this.arcLine !== undefined;
    }

    onMouseUp(event: PointerEvent) {
        super.onMouseUp(event);
        if (this.isRightButtonClick(event) && this.isWorkInProgress()) {
            this.reset();
            return;
        }
    }

    onMouseMove(event: PointerEvent) {
        super.onMouseMove(event);
        if (this.isWorkInProgress()) {
            this.editModeService.moveTemporaryArc(this.arcLine, this.mousePosition(event), this.source.svgElement);
        }
    }

    onPlaceMove(event: PointerEvent, place: CanvasPlace) {
        super.onPlaceMove(event, place);
        if (this.isWorkInProgress()) {
            this.editModeService.moveTemporaryArc(this.arcLine, this.mousePosition(event), this.source.svgElement);
        }
    }

    onTransitionMove(event: PointerEvent, transition: CanvasTransition) {
        super.onTransitionMove(event, transition);
        if (this.isWorkInProgress()) {
            this.editModeService.moveTemporaryArc(this.arcLine, this.mousePosition(event), this.source.svgElement);
        }
    }

    onArcMove(event: PointerEvent, arc: CanvasArc) {
        super.onArcMove(event, arc);
        if (this.isWorkInProgress()) {
            this.editModeService.moveTemporaryArc(this.arcLine, this.mousePosition(event), this.source.svgElement);
        }
    }

    createArc(type: ArcType, source: CanvasNodeElement<any, any>, destination: CanvasNodeElement<any, any>): CanvasArc {
        const modelArc = this.modelService.newArc(source.modelElement, destination.modelElement, type);
        const svgArc = this.editModeService.newSvgArc(modelArc);
        this.historyService.save(`New ${this.modelService.toXmlArcType(modelArc.type)} arc ${modelArc.id} has been created`);
        return svgArc;
    }

    unbind() {
        super.unbind();
        this.reset();
    }

    reset(): void {
        if (this.arcLine) {
            this.canvas.container.removeChild(this.arcLine);
        }
        this.arcLine = undefined;
        this.source = undefined;
    }

    get source(): T {
        return this._source;
    }

    set source(value: T) {
        this._source = value;
    }

    get arcLine(): SVGElement {
        return this._arcLine;
    }

    set arcLine(value: SVGElement) {
        this._arcLine = value;
    }
}
