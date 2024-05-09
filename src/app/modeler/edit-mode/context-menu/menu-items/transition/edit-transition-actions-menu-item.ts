import {MenuItem} from '../menu-item';
import {CanvasTransition} from '../../../domain/canvas-transition';
import {CanvasTool} from '../../../services/modes/canvas-tool';
import {ActionsModeService} from '../../../../actions-mode/actions-mode.service';
import {TransitionActionsTool} from '../../../../actions-mode/tools/transition-actions-tool';

export class EditTransitionActionsMenuItem extends MenuItem {

    constructor(transition: CanvasTransition,
                tool: CanvasTool) {
        super(
            `Actions editor (${tool.modelService.numberOfTransitionActions(transition.modelTransition)})`,
            'code',
            () => {
                tool.actionMode.activate(tool.actionMode.transitionActionsTool);
                tool.actionsMasterDetail.select(transition.modelTransition);
                tool.transitionService.id = transition.id;
                tool.router.navigate(['modeler/actions']);
            }
        );
    }
}
