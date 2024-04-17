import {Component, Inject} from '@angular/core';
import {DataVariable} from '@netgrif/petriflow';
import {MASTER_ITEM, MASTER_SERVICE} from '../../components/master-detail/main-master-item/master-injection-tokens';
import {AbstractMasterDetailService} from '../../components/master-detail/abstract-master-detail.service';

@Component({
    selector: 'nab-data-master-item',
    templateUrl: './data-master-item.component.html',
    styleUrl: './data-master-item.component.scss'
})
export class DataMasterItemComponent {

    constructor(@Inject(MASTER_ITEM) public item: DataVariable,
                @Inject(MASTER_SERVICE) protected _service: AbstractMasterDetailService<any>) {
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
