import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {CreatePTArc} from './create-ptarc';
import {ArcType} from '@netgrif/petriflow';
import {ResetArc as SvgResetArc} from '@netgrif/petri.svg';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';

export class CreateResetArcTool extends CreatePTArc {

    public static ID = 'CreateResetArcTool';

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
            CreateResetArcTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('resetarc', true),
                'Reset Arc',
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

    getMarkerId(): string {
        return SvgResetArc.ID;
    }

    arcType(): ArcType {
        return ArcType.RESET;
    }
}
