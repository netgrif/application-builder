import {MenuItem} from './menu-item';
import {
    DialogManageRolesComponent,
    RoleRefType
} from '../../../../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {DataType} from '@netgrif/petriflow';
import {CanvasTransition} from '../../domain/canvas-transition';
import {CanvasTool} from '../../services/modes/canvas-tool';

export class EditTaskPermissionsMenuItem extends MenuItem {

    constructor(transition: CanvasTransition, tool: CanvasTool) {
        super(
            `Permissions (${tool.modelService.numberOfTransitionPermissions(transition.modelTransition)})`,
            'people',
            () => {
                tool.openDialog(DialogManageRolesComponent, {
                    width: '60%',
                    data: {
                        type: RoleRefType.TRANSITION,
                        roles: tool.modelService.model.getRoles(),
                        rolesRefs: transition.modelTransition.roleRefs,
                        userRefs: transition.modelTransition.userRefs,
                        userLists: tool.modelService.model.getDataSet().filter(item => item.type === DataType.USER_LIST)
                    }
                });
            }
        );
    }
}
