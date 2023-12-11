import {MenuItem} from './menu-item';
import {SelectTool} from '../../services/modes/select-tool';

export class DeleteMenuItem extends MenuItem {

    constructor(selectTool: SelectTool) {
        super(
            `Delete${selectTool.selectedElements.totalSize() > 1 ? ' all' : ''}`,
            'delete',
            () => {
                selectTool.deleteSelected();
            }
        );
    }
}
