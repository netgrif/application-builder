import {MenuItem} from '../menu-item';
import {CanvasTool} from '../../../services/modes/canvas-tool';
import {ChangedPetriNet} from '../../../../history-mode/model/changed-petri-net';
import {DialogModelEditComponent} from '../../../../../dialogs/dialog-model-edit/dialog-model-edit.component';

export class EditModelMenuItem extends MenuItem {

    constructor(tool: CanvasTool) {
        super(
            'Edit model',
            'edit',
            () => {
                tool.openDialog(DialogModelEditComponent, {
                    width: '50%',
                    data: new ChangedPetriNet(tool.model.id, tool.model.clone())
                }, (changedModel: ChangedPetriNet) => {
                    if (changedModel != undefined) {
                        tool.modelService.updateModel(changedModel);
                    }
                });
            }
        );
    }
}
