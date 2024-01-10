import {CanvasTool} from './canvas-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {CanvasPlace} from '../../domain/canvas-place';
import {CanvasTransition} from '../../domain/canvas-transition';

export class CreatePlaceTool extends CanvasTool {

    public static ID = 'CreatePlaceTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            CreatePlaceTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('circle', false, true),
                'Place',
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
        this.bindPlace(this.editModeService.createPlace(this.mousePosition(event)));
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
