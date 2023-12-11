import {Component} from '@angular/core';
import {PetriNet, Transition} from '@netgrif/petriflow';
import {ModelService} from '../../modeler/services/model/model.service';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../modeler/selected-transition.service';

@Component({
    selector: 'nab-info-label',
    templateUrl: './info-label.component.html',
    styleUrls: ['./info-label.component.scss']
})
export class InfoLabelComponent {

    models: Array<PetriNet>;
    transitions: Array<Transition>;
    selectedTransition: Transition;

    constructor(private modelService: ModelService, private router: Router, private transitionService: SelectedTransitionService) {
        const id = this.transitionService.id;
        if (id) {
            this.selectedTransition = this.modelService.model.getTransition(id);
        }
    }

    redirect() {
        this.router.navigate(['']);
    }
}
