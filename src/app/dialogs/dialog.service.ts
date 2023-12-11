import {Injectable} from '@angular/core';
import {DialogModelEditComponent} from './dialog-model-edit/dialog-model-edit.component';
import {ChangedPetriNet} from './dialog-model-edit/changed-petri-net';
import {MatDialog} from '@angular/material/dialog';
import {PetriNet} from '@netgrif/petriflow';
import {ModelService} from '../modeler/services/model/model.service';
import {ArcEditData, DialogArcEditComponent} from './dialog-arc-edit/dialog-arc-edit.component';
import {ChangedArc} from './dialog-arc-edit/changed-arc';
import {CanvasArc} from '../modeler/edit-mode/domain/canvas-arc';

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
            data: new ChangedPetriNet(model.id, model.clone())
        }).afterClosed().subscribe((changedModel: ChangedPetriNet) => {
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
