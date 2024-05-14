import {Component, ViewChild} from '@angular/core';
import {DataDetailComponent} from './data-detail/data-detail.component';
import {ComponentType} from '@angular/cdk/overlay';
import {DataMasterItemComponent} from './data-master-item/data-master-item.component';
import {DataMasterDetailService} from './data-master-detail.service';

export interface TypeArray {
    viewValue: string;
    value: string;
}

@Component({
    selector: 'nab-data-mode',
    templateUrl: './data-mode.component.html',
    styleUrls: ['./data-mode.component.scss'],
})
export class DataModeComponent {

    constructor(protected _masterService: DataMasterDetailService ) {
    }

    get detailComponent(): ComponentType<any> {
        return DataDetailComponent;
    }

    get masterItemComponent(): ComponentType<any> {
        return DataMasterItemComponent;
    }

    get masterService(): DataMasterDetailService {
        return this._masterService;
    }
}
