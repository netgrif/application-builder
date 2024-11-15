import {ArcType} from '@netgrif/petriflow';
import {InhibitorArc as SvgInhibitorArc} from '@netgrif/petri.svg';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {ControlPanelIcon} from '../../../control-panel/control-panel-icon';
import {CreatePTArc} from './create-ptarc';
import {ModelService} from '../../../services/model/model.service';
import {MatDialog} from '@angular/material/dialog';
import {EditModeService} from '../../edit-mode.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {ActionsModeService} from '../../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../../actions-mode/actions-master-detail.setvice';

export class CreateInhibitorArcTool extends CreatePTArc {

    public static ID = 'CreateInhibitorArcTool';

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
            CreateInhibitorArcTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('inhibitor', true),
                'Inhibitor Arc',
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
        return SvgInhibitorArc.ID;
    }

    arcType(): ArcType {
        return ArcType.INHIBITOR;
    }
}
