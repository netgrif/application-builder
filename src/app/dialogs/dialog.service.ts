import {Injectable} from '@angular/core';
import {DialogModelEditComponent} from './dialog-model-edit/dialog-model-edit.component';
import {MatDialog} from '@angular/material/dialog';
import {PetriNet} from '@netgrif/petriflow';
import {ModelService} from '../modeler/services/model/model.service';
import {ArcEditData, DialogArcEditComponent} from './dialog-arc-edit/dialog-arc-edit.component';
import {ChangedArc} from './dialog-arc-edit/changed-arc';
import {CanvasArc} from '../modeler/edit-mode/domain/canvas-arc';
import {ModelChange} from '../modeler/history-mode/model/model/model-change';

@Injectable({
    providedIn: 'root'
})
export class DialogService {

    constructor(
        private dialog: MatDialog,
        private modelService: ModelService
    ) {
    }

    public openModelEditDialog(model: PetriNet = this.modelService.model): void {
        this.dialog.open(DialogModelEditComponent, {
            width: '50%',
            data: new ModelChange(model, model.clone())
        }).afterClosed().subscribe((changedModel: ModelChange) => {
            this.modelService.updateModel(changedModel);
        });
    }

    public openArcEditDialog(arc: CanvasArc): void {
        this.dialog.open(DialogArcEditComponent, {
            width: '50%',
            data: {
                arcId: arc.modelArc.id
            } as ArcEditData
        }).afterClosed().subscribe((editedArc: ChangedArc) => {
            this.modelService.updateArc(editedArc);
        });
    }
}
