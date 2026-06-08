import {CanvasTool} from '../../services/modes/canvas-tool';
import {MenuItem} from './menu-item';

export class AskAiMenuItem extends MenuItem {
    constructor(tool: CanvasTool, context?: string) {
        super(
            'Ask AI',
            'auto_awesome',
            () => {
                const queryParams: Record<string, string> = {};
                if (context) queryParams['context'] = context;
                tool.router.navigate(['/modeler/ai'], {queryParams});
            }
        );
    }
}
