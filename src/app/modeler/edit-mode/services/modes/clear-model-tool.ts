import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ModelService} from '../../../services/model/model.service';
import {EditModeService} from '../../edit-mode.service';
import {CanvasTool} from './canvas-tool';

export class ClearModelTool extends CanvasTool {

    public static readonly ID = 'ClearModelTool';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService,
        actionMode: ActionsModeService,
        actionsMasterDetail: ActionsMasterDetailService,
    ) {
        super(
            ClearModelTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('delete_forever', false, true),
                'Delete model',
            ),
            modelService,
            dialog,
            editModeService,
            router,
            transitionService,
            actionMode,
            actionsMasterDetail,
        );
    }

    onClick(): void {
        super.onClick();
        this.modelService.appService.removeModel(this.modelService.model.id);
    }
}
