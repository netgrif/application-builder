import {MenuItem} from '../menu-item';
import {CanvasTool} from '../../../services/modes/canvas-tool';
import {DialogModelEditComponent} from '../../../../../dialogs/dialog-model-edit/dialog-model-edit.component';
import {ModelChange} from '../../../../history-mode/model/model/model-change';

export class EditModelMenuItem extends MenuItem {

    constructor(tool: CanvasTool) {
        super(
            'Edit model',
            'edit',
            () => {
                tool.openDialog(DialogModelEditComponent, {
                    width: '50%',
                    panelClass: "dialog-width-50",
                    data: new ModelChange(tool.model, tool.model.clone())
                }, (changedModel: ModelChange) => {
                    if (changedModel != undefined) {
                        tool.modelService.updateModel(changedModel);
                    }
                });
            }
        );
    }
}
