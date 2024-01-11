import {CanvasTool} from './canvas-tool';
import {CanvasTransition} from '../../domain/canvas-transition';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {CanvasPlace} from '../../domain/canvas-place';

export class CreateTransitionTool extends CanvasTool {

    public static ID = 'CreateTransitionTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            CreateTransitionTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('square', false, true),
                'Transition',
            ),
            modelService,
            dialog,
            editModeService,
            router,
            transitionService
        );
    }

    onMouseClick(event: MouseEvent) {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            return;
        }
        super.onMouseClick(event);
        const canvasTransition = this.editModeService.createTransition(this.mousePosition(event));
        this.bindTransition(canvasTransition);
    }

    onPlaceClick(event: MouseEvent, place: CanvasPlace) {
        super.onPlaceClick(event, place);
        event.stopPropagation();
    }

    onTransitionClick(event: MouseEvent, transition: CanvasTransition) {
        super.onTransitionClick(event, transition);
        event.stopPropagation();
    }
}
