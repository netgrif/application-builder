import {CanvasPlace} from '../../domain/canvas-place';
import {CanvasTool} from './canvas-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ChangedPlace} from '../../../../dialogs/dialog-place-edit/changed-place';
import {PlaceChangeType} from '../../../../dialogs/dialog-place-edit/place-change-type';

export class RemoveTokenTool extends CanvasTool {

    public static ID = 'RemoveTokenTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            RemoveTokenTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('remove_circle_outline', false, true),
                'Remove token',
            ),
            modelService,
            dialog,
            editModeService,
            router,
            transitionService
        );
    }

    onPlaceUp(event: PointerEvent, place: CanvasPlace) {
        super.onPlaceUp(event, place);
        if (this.isLeftButtonClick(event)) {
            this.removeTokenFrom(place);
        }
    }

    removeTokenFrom(place: CanvasPlace): void {
        if (place.modelPlace.marking < 1) {
            return;
        }
        const changed = new ChangedPlace(PlaceChangeType.EDIT, undefined, place.modelPlace);
        changed.place.marking -= 1;
        this.modelService.updatePlace(changed);
    }
}
