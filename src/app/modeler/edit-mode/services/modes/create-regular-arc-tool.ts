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

    onPlaceClick(event: MouseEvent, place: CanvasPlace): void {
        event.stopPropagation();
        this.onNodeClick(
            place,
            () => this.source instanceof CanvasTransition,
            () => this.createArc(ArcType.REGULAR_TP, this.source, place)
        );
    }

    onTransitionClick(event: MouseEvent, transition: CanvasTransition): void {
        event.stopPropagation();
        this.onNodeClick(
            transition,
            () => this.source instanceof CanvasPlace,
            () => this.createArc(ArcType.REGULAR_PT, this.source, transition)
        );
    }

    onNodeClick(node: CanvasPlace | CanvasTransition, instanceCheck: () => boolean, createArcFunction: () => CanvasArc): void {
        if (this.source && instanceCheck()) {
            const canvasArc = createArcFunction();
            this.bindArc(canvasArc);
            this.reset();
        } else if (!this.source) {
            this.source = node;
            this.arcLine = this.editModeService.createTemporaryArc(node.svgElement.getPosition(), SvgArc.ID);
        }
    }
}
