import {ContextMenu} from '../context-menu';
import {MenuItem} from '../menu-items/menu-item';
import {
    DialogTransitionEditComponent,
    TransitionEditData
} from '../../../../dialogs/dialog-transition-edit/dialog-transition-edit.component';
import {ChangedTransition} from '../../../../dialogs/dialog-transition-edit/changed-transition';
import {
    DialogManageRolesComponent,
    RoleRefType
} from '../../../../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {DataType} from '@netgrif/petriflow';
import {CanvasTransition} from '../../domain/canvas-transition';
import {SelectTool} from '../../services/modes/select-tool';
import {DeleteMenuItem} from '../menu-items/delete-menu-item';

export class TransitionContextMenu extends ContextMenu {

    constructor(transition: CanvasTransition, position: DOMPoint, selectTool: SelectTool) {
        super([], position);
        this.items.push(new MenuItem('Edit Task', 'edit', () => {
            selectTool.openDialog(DialogTransitionEditComponent, {
                width: '50%',
                data: {
                    transitionId: transition.id
                } as TransitionEditData
            }, (editedTransition: ChangedTransition) => {
                selectTool.modelService.updateTransition(editedTransition);
                selectTool.bindKeys();
            });
        }));
        const titleFormEdit = transition.hasForm() ? 'Edit form' : 'Create new form'
        this.items.push(new MenuItem(titleFormEdit, 'dashboard', () => {
            selectTool.transitionService.id = transition.id;
            selectTool.router.navigate(['/form']);
        }));
        this.items.push(new MenuItem(`Permissions (${selectTool.modelService.numberOfTransitionPermissions(transition.modelTransition)})`, 'people', () => {
            selectTool.openDialog(DialogManageRolesComponent, {
                width: '60%',
                data: {
                    type: RoleRefType.TRANSITION,
                    roles: selectTool.modelService.model.getRoles(),
                    rolesRefs: transition.modelTransition.roleRefs,
                    userRefs: transition.modelTransition.userRefs,
                    userLists: selectTool.modelService.model.getDataSet().filter(item => item.type === DataType.USER_LIST)
                }
            });
        }));
        this.items.push(new MenuItem(`Actions editor (${selectTool.modelService.numberOfTransitionActions(transition.modelTransition)})`, 'code', () => {
            selectTool.transitionService.id = transition.id;
            selectTool.router.navigate(['modeler/actions']);
        }));
        this.items.push(new DeleteMenuItem(selectTool));
    }
}
