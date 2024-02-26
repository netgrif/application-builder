import {Component, Input} from '@angular/core';
import {DataVariable} from '@netgrif/petriflow';
import {DataMasterDetailService} from '../data-master-detail.service';

@Component({
    selector: 'nab-data-master-item',
    templateUrl: './data-master-item.component.html',
    styleUrl: './data-master-item.component.scss'
})
export class DataMasterItemComponent {

    @Input({required: true}) item!: DataVariable;

    constructor(private _service: DataMasterDetailService) {
    }

    onDelete(event: MouseEvent, item: DataVariable): void {
// TODO: update total size
    }

    onDuplicate(event: MouseEvent, item: DataVariable): void {
// TODO: update total size
    }

    select(): void {
        this._service.select(this.item);
    }

    get selected(): DataVariable {
        return this._service.getSelected();
    }
}
