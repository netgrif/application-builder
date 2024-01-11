import {MenuItem} from '../menu-item';
import {CanvasTool} from '../../../services/modes/canvas-tool';
import {ArcEditData, DialogArcEditComponent} from '../../../../../dialogs/dialog-arc-edit/dialog-arc-edit.component';
import {CanvasArc} from '../../../domain/canvas-arc';
import {ChangedArc} from '../../../../../dialogs/dialog-arc-edit/changed-arc';

export class EditArcMenuItem extends MenuItem {

    constructor(arc: CanvasArc, tool: CanvasTool) {
        super(
            'Edit',
            'edit',
            () => {
                tool.openDialog(DialogArcEditComponent, {
                    width: '50%',
                    data: {
                        arcId: arc.modelArc.id
                    } as ArcEditData
                }, (editedArc: ChangedArc) => {
                    tool.modelService.updateArc(editedArc);
                });
            }
        );
    }
}
