import {CanvasPlace} from '../../domain/canvas-place';
import {CanvasTool} from './canvas-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {PlaceChange} from '../../../history-mode/model/place/place-change';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';

export class RemoveTokenTool extends CanvasTool {

    public static ID = 'RemoveTokenTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService,
        actionMode: ActionsModeService,
        actionsMasterDetail: ActionsMasterDetailService
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
            transitionService,
            actionMode,
            actionsMasterDetail
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
        const changed = new PlaceChange(place.modelPlace, place.modelPlace, undefined);
        changed.place.marking -= 1;
        this.modelService.updatePlace(changed);
        this.historyService.save(`Token has been removed from place ${place.id}.`);
    }
}
