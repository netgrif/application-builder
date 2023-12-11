import {LeafNode} from './leaf-node';
import {ActionEditorService} from '../action-editor.service';
import {ActionType} from './editable-action';

describe('LeafNode', () => {
    it('should create an instance', () => {
        expect(new LeafNode(ActionType.TRANSITION, new ActionEditorService())).toBeTruthy();
    });
});
