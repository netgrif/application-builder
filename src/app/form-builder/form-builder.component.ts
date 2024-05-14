import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ModelService} from '../modeler/services/model/model.service';

@Component({
    selector: 'nab-form-builder',
    templateUrl: './form-builder.component.html',
    styleUrls: ['./form-builder.component.scss']
})
export class FormBuilderComponent {
    title = 'form-builder';
    width: number;

    constructor(private router: Router, private modelService: ModelService) {
        if (!this.modelService.model) {
            this.router.navigate(['/modeler']);
        }
    }

    onResizeEvent(event: any): void {
        if (event.rectangle.width > 450) {
            this.width = 450;
        } else if (event.rectangle.width < 200) {
            this.width = 200;
        } else {
            this.width = event.rectangle.width;
        }
    }
}
