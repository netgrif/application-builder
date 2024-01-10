import {MenuItem} from '../menu-item';
import {
    DialogTransitionEditComponent,
    TransitionEditData
} from '../../../../../dialogs/dialog-transition-edit/dialog-transition-edit.component';
import {CanvasTransition} from '../../../domain/canvas-transition';
import {CanvasTool} from '../../../services/modes/canvas-tool';
import {ChangedTransition} from '../../../../../dialogs/dialog-transition-edit/changed-transition';

export class EditTransitionMenuItem extends MenuItem {

    constructor(transition: CanvasTransition, tool: CanvasTool) {
        super(
            'Edit Task',
            'edit',
            () => {
                tool.openDialog(DialogTransitionEditComponent, {
                    width: '50%',
                    data: {
                        transitionId: transition.id
                    } as TransitionEditData
                }, (editedTransition: ChangedTransition) => {
                    tool.modelService.updateTransition(editedTransition);
                    tool.bindKeys();
                });
            }
        );
    }
}
