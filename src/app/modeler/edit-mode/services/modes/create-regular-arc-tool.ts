import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {CreateArcTool} from './create-arc-tool';
import {CanvasPlace} from '../../domain/canvas-place';
import {CanvasTransition} from '../../domain/canvas-transition';
import {RegularTransitionPlaceArc as SvgArc} from '@netgrif/petri.svg';
import {CanvasArc} from '../../domain/canvas-arc';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ArcType} from '@netgrif/petriflow';
import {Observable, of} from 'rxjs';

export class CreateRegularArcTool extends CreateArcTool<CanvasPlace | CanvasTransition> {

    public static ID = 'CreateRegularArcTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            CreateRegularArcTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('arc', true),
                'Arc',
            ),
            modelService,
            dialog,
            editModeService,
            router,
            transitionService
        );
    }

    onPlaceUp(event: PointerEvent, place: CanvasPlace): void {
        super.onPlaceUp(event, place);
        this.onNodeClick(
            place,
            event,
            () => this.source instanceof CanvasTransition,
            () => this.createArc(ArcType.REGULAR_TP, this.source, place),
        );
    }

    onTransitionUp(event: PointerEvent, transition: CanvasTransition): void {
        super.onTransitionUp(event, transition);
        this.onNodeClick(
            transition,
            event,
            () => this.source instanceof CanvasPlace,
            () => this.createArc(ArcType.REGULAR_PT, this.source, transition)
        )
    }

    onNodeClick(node: CanvasPlace | CanvasTransition, event: PointerEvent, instanceCheck: () => boolean, createArcFunction: () => CanvasArc): void {
        if (this.isRightButtonClick(event)) {
            if (this.isWorkInProgress()) {
                this.reset();
                return;
            }
        } else if (this.isLeftButtonClick(event)) {
            if (this.isWorkInProgress() && instanceCheck()) {
                this.finishDrawingArc(createArcFunction);
            } else if (!this.isWorkInProgress()) {
                this.startDrawingArc(node);
            }
        }
    }

    startDrawingArc(node: CanvasPlace | CanvasTransition): void {
        this.source = node;
        this.arcLine = this.editModeService.createTemporaryArc(node.svgElement.getPosition(), SvgArc.ID);
    }

    finishDrawingArc(createArcFunction: () => CanvasArc): void {
        const canvasArc = createArcFunction();
        this.bindArc(canvasArc);
        this.reset();
    }
}
