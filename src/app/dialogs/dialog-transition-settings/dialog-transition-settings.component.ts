import {Component, OnInit} from '@angular/core';
import {AssignPolicy, FinishPolicy, Transition} from '@netgrif/petriflow';
import {ModelService} from '../../modeler/services/model.service';
import {SelectedTransitionService} from '../../modeler/selected-transition.service';

@Component({
    selector: 'nab-dialog-transition-settings',
    templateUrl: './dialog-transition-settings.component.html',
    styleUrls: ['./dialog-transition-settings.component.scss']
})
export class DialogTransitionSettingsComponent implements OnInit {
    transition: Transition;
    assignPolicyOptions: Array<AssignPolicy>;
    finishPolicyOptions: Array<FinishPolicy>;

    constructor(private modelService: ModelService, private transitionService: SelectedTransitionService) {
    }

    ngOnInit(): void {
        this.transition = this.modelService.model.getTransition(this.transitionService.id);
        this.assignPolicyOptions = [AssignPolicy.MANUAL, AssignPolicy.AUTO];
        this.finishPolicyOptions = [FinishPolicy.MANUAL, FinishPolicy.AUTO_NO_DATA];
    }
}
