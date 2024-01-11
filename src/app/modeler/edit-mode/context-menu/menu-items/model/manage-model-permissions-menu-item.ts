import {MenuItem} from '../menu-item';
import {CanvasTool} from '../../../services/modes/canvas-tool';
import {DataType} from '@netgrif/petriflow';
import {
    DialogManageRolesComponent,
    RoleRefType
} from '../../../../../dialogs/dialog-manage-roles/dialog-manage-roles.component';

export class ManageModelPermissionsMenuItem extends MenuItem {

    constructor(tool: CanvasTool) {
        super(
            'Manage process permissions',
            'people',
            () => {
                tool.openDialog(DialogManageRolesComponent, {
                    width: '60%',
                    data: {
                        type: RoleRefType.PROCESS,
                        roles: tool.model.getRoles(),
                        processRolesRefs: tool.model.getRoleRefs(),
                        processUserRefs: tool.model.getUserRefs(),
                        userLists: tool.model.getDataSet().filter(item => item.type === DataType.USER_LIST)
                    }
                });
            }
        );
    }
}
