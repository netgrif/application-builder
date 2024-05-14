import {Component, Inject} from '@angular/core';
import {DataVariable} from '@netgrif/petriflow';
import {MASTER_ITEM, MASTER_SERVICE} from '../../components/master-detail/main-master-item/master-injection-tokens';
import {AbstractMasterDetailService} from '../../components/master-detail/abstract-master-detail.service';
import {DialogDeleteComponent} from '../../../dialogs/dialog-delete/dialog-delete.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'nab-data-master-item',
    templateUrl: './data-master-item.component.html',
    styleUrl: './data-master-item.component.scss'
})
export class DataMasterItemComponent {

    public showIcons: boolean;

    constructor(@Inject(MASTER_ITEM) public item: DataVariable,
                @Inject(MASTER_SERVICE) protected _service: AbstractMasterDetailService<any>,
                protected _dialog: MatDialog) {
    }

    onDelete(event: MouseEvent, item: DataVariable): void {
        event.stopPropagation();
        const dialogRef = this._dialog.open(DialogDeleteComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this._service.delete(item);
            }
        });
    }

    onDuplicate(event: MouseEvent, item: DataVariable): void {
        event.stopPropagation();
        this._service.duplicate(item);
    }

    select(): void {
        this._service.select(this.item);
    }

    get selected(): DataVariable {
        return this._service.getSelected();
    }
}
