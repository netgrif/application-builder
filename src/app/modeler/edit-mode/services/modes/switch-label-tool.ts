import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {DataType, NodeElement} from '@netgrif/petriflow';
import {CanvasTool} from './canvas-tool';
import {Injectable} from '@angular/core';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';
import {DialogAssistantComponent} from "../../../../dialogs/dialog-assistant/dialog-assistant.component";

export class SwitchLabelTool extends CanvasTool {

    public static readonly ID = 'Assistant';
    public static readonly ICON_ON = 'accessibility';
    public static readonly TOOLTIP_ON = 'Assistant';
    public static readonly ICON_OFF = 'label_off';
    public static readonly TOOLTIP_OFF = 'Show labels';
    private turnedOn = true;

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
            SwitchLabelTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon(SwitchLabelTool.ICON_ON, false, true),
                SwitchLabelTool.TOOLTIP_ON,
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

        this.dialog.open(DialogAssistantComponent, {
            width: '920px',
            panelClass: 'ai-dialog',
            data: { /* čo potrebuješ poslať */ },
        });
    }
}
