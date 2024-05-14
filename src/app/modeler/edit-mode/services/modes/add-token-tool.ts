import {CanvasTool} from './canvas-tool';
import {CanvasPlace} from '../../domain/canvas-place';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from 'src/app/modeler/control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';
import {PlaceChange} from '../../../history-mode/model/place/place-change';

export class AddTokenTool extends CanvasTool {

    public static readonly ID = 'AddTokenTool';

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
            AddTokenTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('add_circle_outline', false, true),
                'Add token',
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
            this.addTokenTo(place);
        }
    }

    addTokenTo(place: CanvasPlace): void {
        const changed = new PlaceChange(place.modelPlace, place.modelPlace, undefined);
        changed.place.marking += 1;
        this.modelService.updatePlace(changed);
        this.historyService.save(`Token has been added to place ${place.id}.`);
    }
}
