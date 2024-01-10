import {DeleteMenuItem} from '../delete-menu-item';
import {CanvasArc} from '../../../domain/canvas-arc';
import {CanvasTool} from '../../../services/modes/canvas-tool';

export class DeleteArcMenuItem extends DeleteMenuItem {

    constructor(arc: CanvasArc, tool: CanvasTool) {
        super(() => {
            tool.deleteArc(arc);
        });
    }
}
