import {CanvasTool} from './canvas-tool';
import {CanvasPlace} from '../../domain/canvas-place';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from 'src/app/modeler/control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ChangedPlace} from '../../../../dialogs/dialog-place-edit/changed-place';

export class AddTokenTool extends CanvasTool {

    public static readonly ID = 'AddTokenTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            AddTokenTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('add_circle_outline', false, true),
                'Add token',
            ),
            modelService,
            dialog,
            editModeService,
            router,
            transitionService
        );
    }

    onPlaceClick(event: MouseEvent, place: CanvasPlace) {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            return;
        }
        super.onPlaceClick(event, place);
        const changed = new ChangedPlace(undefined, place.modelPlace);
        changed.place.marking += 1;
        this.modelService.updatePlace(changed);
    }
}