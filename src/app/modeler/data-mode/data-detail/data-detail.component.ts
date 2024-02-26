import {Component} from '@angular/core';
import {DataMasterDetailService} from '../data-master-detail.service';
import {DataVariable} from '@netgrif/petriflow';

@Component({
    selector: 'nab-data-detail',
    standalone: true,
    templateUrl: './data-detail.component.html',
    styleUrl: './data-detail.component.scss'
})
export class DataDetailComponent {

    public constructor(private _service: DataMasterDetailService) {
    }

    get item(): DataVariable {
        return this.service.getSelected();
    }

    get service(): DataMasterDetailService {
        return this._service;
    }
}
