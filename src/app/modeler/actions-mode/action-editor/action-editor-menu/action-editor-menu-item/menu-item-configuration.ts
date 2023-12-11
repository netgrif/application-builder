import {editor} from 'monaco-editor';
import {ActionEditorComponent} from '../../action-editor/action-editor.component';
import {FunctionEditorComponent} from '../../function-editor/function-editor.component';
import {MenuItem} from './menu-item';
import ICodeEditor = editor.ICodeEditor;

export class MenuItemConfiguration {
  constructor(title: string, itemType: string, keywords: Array<string>, editorObject: ICodeEditor, actionEditor: ActionEditorComponent | FunctionEditorComponent, items: Array<MenuItem>) {
    this._title = title;
    this._itemType = itemType;
    this._keywords = keywords;
    this._editor = editorObject;
    this._actionEditor = actionEditor;
    this._items = items;
  }

  private _title: string;

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }

  private _itemType: string;

  get itemType(): string {
    return this._itemType;
  }

  set itemType(value: string) {
    this._itemType = value;
  }

  private _keywords: Array<string>;

  get keywords(): Array<string> {
    return this._keywords;
  }

  set keywords(value: Array<string>) {
    this._keywords = value;
  }

  private _editor: any;

  get editor(): ICodeEditor {
    return this._editor;
  }

  set editor(value: ICodeEditor) {
    this._editor = value;
  }

  private _actionEditor: ActionEditorComponent | FunctionEditorComponent;

  get actionEditor(): ActionEditorComponent | FunctionEditorComponent {
    return this._actionEditor;
  }

  set actionEditor(value: ActionEditorComponent | FunctionEditorComponent) {
    this._actionEditor = value;
  }

  private _items: Array<MenuItem>;

  get items(): Array<MenuItem> {
    return this._items;
  }

  set items(value: Array<MenuItem>) {
    this._items = value;
  }
}
