import {Component, EventEmitter, Input, Output} from '@angular/core';
import {EditableAction} from '../classes/editable-action';
import {LeafNode} from '../classes/leaf-node';

export interface ActionChangedEvent {
  triggerPath?: Array<string>;
  action: EditableAction;
}

@Component({
  selector: 'nab-action-editor-list',
  templateUrl: './action-editor-list.component.html',
  styleUrls: ['./action-editor-list.component.scss'],
})
export class ActionEditorListComponent {

  @Input() public leafNode: LeafNode;

  @Output() public actionChanged: EventEmitter<ActionChangedEvent>;
  @Output() public drawerOpened: EventEmitter<boolean>;

  constructor() {
    this.actionChanged = new EventEmitter<ActionChangedEvent>();
    this.drawerOpened = new EventEmitter<boolean>();
  }

  actionChangedListener($event) {
    this.actionChanged.emit($event);
  }

  drawerChanged($event) {
    this.drawerOpened.emit($event);
  }

}
