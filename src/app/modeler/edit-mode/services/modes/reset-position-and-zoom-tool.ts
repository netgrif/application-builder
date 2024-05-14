import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {CanvasTool} from './canvas-tool';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';

export class ResetPositionAndZoomTool extends CanvasTool {

    public static readonly ID = 'ResetPositionAndZoomTool';

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
            ResetPositionAndZoomTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('fit_screen', false, true),
                'Reset canvas position and zoom',
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
        this.editModeService.panzoom?.reset();
    }
}
