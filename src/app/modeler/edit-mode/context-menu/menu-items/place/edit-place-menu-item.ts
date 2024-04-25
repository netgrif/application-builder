import {MenuItem} from '../menu-item';
import {
    DialogPlaceEditComponent,
    PlaceEditData
} from '../../../../../dialogs/dialog-place-edit/dialog-place-edit.component';
import {ChangedPlace} from '../../../../../dialogs/dialog-place-edit/changed-place';
import {CanvasPlace} from '../../../domain/canvas-place';
import {CanvasTool} from '../../../services/modes/canvas-tool';

export class EditPlaceMenuItem extends MenuItem {

    constructor(
        place: CanvasPlace,
        tool: CanvasTool
    ) {
        super(
            'Edit',
            'edit',
            () => {
                tool.openDialog(DialogPlaceEditComponent, {
                    width: '50%',
                    panelClass: "dialog-width-50",
                    data: {
                        placeId: place.modelPlace.id
                    } as PlaceEditData
                }, (editedPlace: ChangedPlace) => {
                    tool.modelService.updatePlace(editedPlace);
                });
            }
        );
    }
}
