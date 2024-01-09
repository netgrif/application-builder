import {MenuItem} from './menu-item';
import {CanvasTool} from '../../services/modes/canvas-tool';
import {CanvasObject} from '../../domain/canvas-object';

export class DeleteMenuItem extends MenuItem {

    constructor(canvasObject: CanvasObject<any, any>, tool: CanvasTool) {
        super(
            'Delete',
            'delete',
            () => {
                tool.delete(canvasObject);
            }
        );
    }
}
