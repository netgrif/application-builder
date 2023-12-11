import {SimulationTool} from './simulation-tool';
import {ControlPanelButton} from '../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../control-panel/control-panel-icon';
import {MatDialog} from '@angular/material/dialog';
import {
    Data,
    DataSet,
    DialogChangeDataComponent
} from '../../../dialogs/dialog-change-data/dialog-change-data.component';
import {ModelService} from '../../services/model/model.service';
import {SimulationModeService} from '../simulation-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../selected-transition.service';

export class ChangeDataTool extends SimulationTool {

    constructor(
        modelService: ModelService,
        dialog: MatDialog,
        simulationModeService: SimulationModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(
            'change_data',
            new ControlPanelButton(
                new ControlPanelIcon('all_inbox'),
                'Change data'
            ),
            modelService,
            dialog,
            simulationModeService,
            router,
            transitionService
        );
    }

    onClick() {
        super.onClick();
        this.dialog.open(DialogChangeDataComponent, {
            width: '50%',
            data: {
                dataSet: this.simulationModeService.data
            } as DataSet
        }).afterClosed().subscribe((data: Array<Data>) => {
            if (data) {
                const dataSet = new Map<string, number>(data.map(d => [d.id, d.value]));
                this.simulationModeService.data = dataSet;
                this.simulation.updateData(dataSet);
                this.simulationModeService.renderModel(this.simulation.simulationModel);
            }
        });
    }
}
