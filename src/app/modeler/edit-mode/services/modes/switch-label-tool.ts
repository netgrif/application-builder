import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {NodeElement} from '@netgrif/petriflow';
import {CanvasTool} from './canvas-tool';
import {Injectable} from '@angular/core';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';

export class SwitchLabelTool extends CanvasTool {

    public static readonly ID = 'SwitchLabelTool';
    public static readonly ICON_ON = 'label';
    public static readonly TOOLTIP_ON = 'Show IDs';
    public static readonly ICON_OFF = 'label_off';
    public static readonly TOOLTIP_OFF = 'Show labels';
    private turnedOn = true;

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
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
            transitionService
        );
    }

    onClick(): void {
        // TODO: NAB-326 abstract class for switches, make sure they turn to default state on canvas render
        if (this.turnedOn) {
            this.icon.name = SwitchLabelTool.ICON_OFF;
            this.tooltip = SwitchLabelTool.TOOLTIP_OFF;
            this.editModeService.labelText = (n: NodeElement) => n.id;
        } else {
            this.icon.name = SwitchLabelTool.ICON_ON;
            this.tooltip = SwitchLabelTool.TOOLTIP_ON;
            this.editModeService.labelText = (n: NodeElement) => n.label.value;
        }
        this.editModeService.elements.places.forEach(p => {
            p.svgElement.canvasElement.setLabelText(this.editModeService.labelText(p.modelPlace));
        })
        this.editModeService.elements.transitions.forEach(t => {
            t.svgTransition.canvasElement.setLabelText(this.editModeService.labelText(t.modelTransition));
        })
        this.turnedOn = !this.turnedOn;
    }
}
