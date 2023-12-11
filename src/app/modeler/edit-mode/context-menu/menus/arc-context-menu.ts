import {ContextMenu} from '../context-menu';
import {CanvasArc} from '../../domain/canvas-arc';
import {SelectTool} from '../../services/modes/select-tool';
import {MenuItem} from '../menu-items/menu-item';
import {ArcEditData, DialogArcEditComponent} from '../../../../dialogs/dialog-arc-edit/dialog-arc-edit.component';
import {ChangedArc} from '../../../../dialogs/dialog-arc-edit/changed-arc';
import {DeleteMenuItem} from '../menu-items/delete-menu-item';

export class ArcContextMenu extends ContextMenu {

    constructor(arc: CanvasArc, windowPosition: DOMPoint, canvasPosition: DOMPoint, selectTool: SelectTool) {
        super([], windowPosition);
        this.items.push(new MenuItem('Edit', 'edit', () => {
            selectTool.openDialog(DialogArcEditComponent, {
                width: '50%',
                data: {
                    arcId: arc.modelArc.id
                } as ArcEditData
            }, (editedArc: ChangedArc) => {
                selectTool.modelService.updateArc(editedArc);
            });
        }));
        const breakPointIndex = arc.findNearbyBreakpoint(canvasPosition);
        if (breakPointIndex !== undefined) {
            this.items.push(new MenuItem('Delete breakpoint', 'clear', () => {
                selectTool.editModeService.removeBreakpoint(arc, breakPointIndex);
            }));
        }
        this.items.push(new DeleteMenuItem(selectTool));
    }
}
