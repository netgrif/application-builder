import {CanvasTool} from './canvas-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';

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

    onMouseUp(event: PointerEvent) {
        super.onMouseUp(event);
        if (this.isLeftButtonClick(event)) {
            const place = this.editModeService.createPlace(this.mousePosition(event));
            this.bindPlace(place);
            this.historyService.save(`Place ${place.id} has been created.`);
        }
    }
}
