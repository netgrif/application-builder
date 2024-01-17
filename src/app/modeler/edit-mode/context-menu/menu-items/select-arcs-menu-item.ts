import {MenuItem} from './menu-item';
import {SelectTool} from '../../services/modes/select-tool';
import {CanvasNodeElement} from '../../domain/canvas-node-element';

export class SelectArcsMenuItem extends MenuItem {

    constructor(tool: SelectTool, element: CanvasNodeElement<any, any>) {
        super(
            `Select connected arcs`,
            'sync_alt',
            () => {
                tool.selectConnectedArcs(element);
            }
        );
    }
}
