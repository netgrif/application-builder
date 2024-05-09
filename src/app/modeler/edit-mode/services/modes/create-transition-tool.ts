import {CanvasTool} from './canvas-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';

export class CreateTransitionTool extends CanvasTool {

    public static ID = 'CreateTransitionTool';

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
            CreateTransitionTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('square', false, true),
                'Transition',
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

    onMouseUp(event: PointerEvent) {
        super.onMouseUp(event);
        if (this.isLeftButtonClick(event)) {
            const canvasTransition = this.editModeService.createTransition(this.mousePosition(event));
            this.bindTransition(canvasTransition);
        }
    }
}
