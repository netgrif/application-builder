import {MenuItem} from '../menu-item';
import {CanvasTransition} from '../../../domain/canvas-transition';
import {CanvasTool} from '../../../services/modes/canvas-tool';

export class EditTransitionActionsMenuItem extends MenuItem {

    constructor(transition: CanvasTransition, tool: CanvasTool) {
        super(
            `Actions editor (${tool.modelService.numberOfTransitionActions(transition.modelTransition)})`,
            'code',
            () => {
                tool.transitionService.id = transition.id;
                tool.router.navigate(['modeler/actions']);
            }
        );
    }
}
