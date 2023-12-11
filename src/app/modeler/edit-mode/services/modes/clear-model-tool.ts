import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {DialogDeleteModelComponent} from '../../../../dialogs/dialog-delete-model/dialog-delete-model.component';
import {CanvasTool} from './canvas-tool';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';

export class ClearModelTool extends CanvasTool {

    public static readonly ID = 'ClearModelTool'

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
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
            transitionService
        );
    }

    onClick(): void {
        const dialogRef = this.dialog.open(DialogDeleteModelComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.modelService.model = this.modelService.newModel();
            }
        });
    }
}
