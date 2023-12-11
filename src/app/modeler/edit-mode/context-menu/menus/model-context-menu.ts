import {ContextMenu} from '../context-menu';
import {SelectTool} from '../../services/modes/select-tool';
import {MenuItem} from '../menu-items/menu-item';
import {DialogModelEditComponent} from '../../../../dialogs/dialog-model-edit/dialog-model-edit.component';
import {ChangedPetriNet} from '../../../../dialogs/dialog-model-edit/changed-petri-net';
import {
    DialogManageRolesComponent,
    RoleRefType
} from '../../../../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {DataType} from '@netgrif/petriflow';

export class ModelContextMenu extends ContextMenu {

    constructor(position: DOMPoint, selectTool: SelectTool) {
        super([], position);
        this.items.push(new MenuItem('Edit model', 'edit', () => {
            selectTool.openDialog(DialogModelEditComponent, {
                width: '50%',
                data: new ChangedPetriNet(selectTool.model.id, selectTool.model.clone())
            }, (changedModel: ChangedPetriNet) => {
                selectTool.modelService.updateModel(changedModel);
            });
        }));
        this.items.push(new MenuItem('Manage process permissions', 'people', () => {
            selectTool.openDialog(DialogManageRolesComponent, {
                width: '60%',
                data: {
                    type: RoleRefType.PROCESS,
                    roles: selectTool.model.getRoles(),
                    processRolesRefs: selectTool.model.getRoleRefs(),
                    processUserRefs: selectTool.model.getUserRefs(),
                    userLists: selectTool.model.getDataSet().filter(item => item.type === DataType.USER_LIST)
                }
            });
        }));
    }
}
