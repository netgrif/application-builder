import {MenuItem} from './menu-item';
import {ActionEditorComponent} from '../../action-editor/action-editor.component';
import {FunctionEditorComponent} from '../../function-editor/function-editor.component';
import {editor} from 'monaco-editor';
import ICodeEditor = editor.ICodeEditor;

export class MenuItemConfiguration {
    private _title: string;
    private _itemType: string;
    private _keywords: Array<string>;
    private _editor: any;
    private _actionEditor: ActionEditorComponent | FunctionEditorComponent;
    private _items: Array<MenuItem>;

    constructor(title: string, itemType: string, keywords: Array<string>, editorObject: ICodeEditor, actionEditor: ActionEditorComponent | FunctionEditorComponent, items: Array<MenuItem>) {
        this._title = title;
        this._itemType = itemType;
        this._keywords = keywords;
        this._editor = editorObject;
        this._actionEditor = actionEditor;
        this._items = items;
    }

    get title(): string {
        return this._title;
    }

    set title(value: string) {
        this._title = value;
    }

    get itemType(): string {
        return this._itemType;
    }

    set itemType(value: string) {
        this._itemType = value;
    }

    get keywords(): Array<string> {
        return this._keywords;
    }

    set keywords(value: Array<string>) {
        this._keywords = value;
    }

    get editor(): ICodeEditor {
        return this._editor;
    }

    set editor(value: ICodeEditor) {
        this._editor = value;
    }

    get actionEditor(): ActionEditorComponent | FunctionEditorComponent {
        return this._actionEditor;
    }

    set actionEditor(value: ActionEditorComponent | FunctionEditorComponent) {
        this._actionEditor = value;
    }

    get items(): Array<MenuItem> {
        return this._items;
    }

    set items(value: Array<MenuItem>) {
        this._items = value;
    }
}
