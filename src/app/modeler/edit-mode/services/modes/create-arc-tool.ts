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

export abstract class CreateArcTool<T extends CanvasNodeElement<NodeElement, PetriflowNode<SvgNodeElement>>> extends CanvasTool {

    private _source: T;
    private _arcLine: SVGElement;

    constructor(_id: string, button: ControlPanelButton, modelService: ModelService, dialog: MatDialog, editModeService: EditModeService, router: Router, transitionService: SelectedTransitionService) {
        super(_id, button, modelService, dialog, editModeService, router, transitionService);
    }

    isWorkInProgress(): boolean {
        return this.arcLine !== undefined;
    }

    onMouseMove(event: MouseEvent) {
        if (!this.arcLine) {
            return;
        }
        this.editModeService.moveTemporaryArc(this.arcLine, this.mousePosition(event), this.source.svgElement);
    }

    createArc(type: ArcType, source: CanvasNodeElement<any, any>, destination: CanvasNodeElement<any, any>): CanvasArc {
        const modelArc = this.modelService.newArc(source.modelElement, destination.modelElement, type);
        return this.editModeService.newSvgArc(modelArc);
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

    onContextMenu(event: MouseEvent) {
        super.onContextMenu(event);
        this.reset();
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
