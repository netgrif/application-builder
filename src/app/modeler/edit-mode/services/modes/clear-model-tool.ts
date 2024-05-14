import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {DialogDeleteModelComponent} from '../../../../dialogs/dialog-delete-model/dialog-delete-model.component';
import {CanvasTool} from './canvas-tool';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';

export class ClearModelTool extends CanvasTool {

    public static readonly ID = 'ClearModelTool'

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
            actionsMasterDetail
        );
    }

    onClick(): void {
        super.onClick();
        const dialogRef = this.dialog.open(DialogDeleteModelComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                const oldId = this.modelService.model.id;
                this.modelService.model = this.modelService.newModel();
                this.historyService.save(`Model ${oldId} has been deleted.`);
            }
        });
    }
}
