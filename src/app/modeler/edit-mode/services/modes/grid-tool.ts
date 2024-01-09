import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {CanvasTool} from './canvas-tool';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';

export class GridTool extends CanvasTool {

    public static readonly ID = 'GridTool';
    public static readonly ICON_ON = 'grid_on';
    public static readonly TOOLTIP_ON = 'Hide grid';
    public static readonly ICON_OFF = 'grid_off';
    public static readonly TOOLTIP_OFF = 'Show grid';

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            GridTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon(GridTool.ICON_ON, false, true),
                GridTool.TOOLTIP_ON,
            ),
            modelService,
            dialog,
            editModeService,
            router,
            transitionService
        );
    }

    onClick(): void {
        super.onClick();
        this.editModeService.canvasService.gridOnOff();
        let newIcon = GridTool.ICON_OFF;
        let newTooltip = GridTool.TOOLTIP_OFF;
        if (this.editModeService.canvasService.gridConfiguration.enabled) {
            newIcon = GridTool.ICON_ON;
            newTooltip = GridTool.TOOLTIP_ON;
        }
        this.icon.name = newIcon;
        this.tooltip = newTooltip;
    }
}
