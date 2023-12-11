import {Component} from '@angular/core';
import {ModelService} from '../../modeler/services/model.service';
import {DataVariable} from '@netgrif/petriflow';
import {MatDialogRef} from '@angular/material/dialog';
import {ModelerConfig} from '../../modeler/modeler-config';

@Component({
    selector: 'nab-dialog-arc-attach',
    templateUrl: './dialog-arc-attach.component.html',
    styleUrls: ['./dialog-arc-attach.component.scss']
})
export class DialogArcAttachComponent {
    dataSource: Array<DataVariable>;
    length: number;
    pageSize: number;
    pageIndex: number;
    pageSizeOptions: Array<number> = [10, 20, 50, 100];
    selectedItem: DataVariable;

    constructor(private modelService: ModelService, public dialogRef: MatDialogRef<DialogArcAttachComponent>) {
        this.pageSize = 20;
        this.pageIndex = 0;
        this.dataSource = this.modelService.model.getDataSet().filter(data => ModelerConfig.VARIABLE_ARC_DATA_TYPES.includes(data.type));
        this.length = this.dataSource.length;
        if (this.modelService.graphicModel.arcForData.arc.reference) {
            this.selectedItem = this.modelService.model.getData(this.modelService.graphicModel.arcForData.arc.reference);
        }
        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.close(this.selectedItem);
        });
    }

    onPageChanged(e) {
        this.pageIndex = e.pageIndex;
        this.pageSize = e.pageSize;
        const firstCut = e.pageIndex * e.pageSize;
        const secondCut = firstCut + e.pageSize;
        this.dataSource = this.modelService.model.getDataSet().slice(firstCut, secondCut);
    }

    setArcVariability(item: DataVariable) {
        if (!item.init) {
            alert('Empty init.');
            return;
        }
        const vaha = parseInt(item.init.expression, 10);
        if (vaha < 0) {
            alert('A negative number. Cannot change the value of arc weight.');
            return;
        }
        this.selectedItem = item;
    }

    removeArcVariability() {
        this.selectedItem = undefined;
    }

    isSelected(item: DataVariable): boolean {
        if (this.selectedItem !== undefined) {
            return item.id === this.selectedItem.id;
        } else {
            return false;
        }
    }
}
