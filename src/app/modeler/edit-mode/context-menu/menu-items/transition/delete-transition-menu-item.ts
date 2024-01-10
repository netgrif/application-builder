import {DeleteMenuItem} from '../delete-menu-item';
import {CanvasTool} from '../../../services/modes/canvas-tool';
import {CanvasTransition} from '../../../domain/canvas-transition';

export class DeleteTransitionMenuItem extends DeleteMenuItem {

    constructor(transition: CanvasTransition, tool: CanvasTool) {
        super(() => {
            tool.deleteTransition(transition);
        });
    }
}
