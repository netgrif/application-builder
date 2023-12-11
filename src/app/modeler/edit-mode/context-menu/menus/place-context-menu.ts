import {ContextMenu} from '../context-menu';
import {MenuItem} from '../menu-items/menu-item';
import {
    DialogPlaceEditComponent,
    PlaceEditData
} from '../../../../dialogs/dialog-place-edit/dialog-place-edit.component';
import {ChangedPlace} from '../../../../dialogs/dialog-place-edit/changed-place';
import {CanvasPlace} from '../../domain/canvas-place';
import {SelectTool} from '../../services/modes/select-tool';
import {DeleteMenuItem} from '../menu-items/delete-menu-item';

export class PlaceContextMenu extends ContextMenu {
    constructor(
        place: CanvasPlace,
        position: DOMPoint,
        selectTool: SelectTool
    ) {
        super([], position);
        this.items.push(new MenuItem('Edit', 'edit', () => {
            selectTool.openDialog(DialogPlaceEditComponent, {
                width: '50%',
                data: {
                    placeId: place.modelPlace.id
                } as PlaceEditData
            }, (editedPlace: ChangedPlace) => {
                selectTool.modelService.updatePlace(editedPlace);
            });
        }));
        this.items.push(new DeleteMenuItem(selectTool));

    }
}
