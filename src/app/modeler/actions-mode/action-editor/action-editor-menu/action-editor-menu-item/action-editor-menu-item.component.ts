import {AfterViewChecked, Component, Input, ViewChild} from '@angular/core';
import {MatMenu, MatMenuTrigger} from '@angular/material/menu';
import {ActionItemProviderService} from '../../action-item-provider.service';
import {MenuItem} from './menu-item';
import {MenuItemConfiguration} from './menu-item-configuration';

@Component({
  selector: 'nab-action-editor-menu-item',
  templateUrl: './action-editor-menu-item.component.html',
  styleUrls: ['./action-editor-menu-item.component.scss'],
  exportAs: 'menuInOtherComponent',
})
export class ActionEditorMenuItemComponent implements AfterViewChecked {

  @Input() configuration: MenuItemConfiguration;

  @Input() trigger: MatMenuTrigger;

  @ViewChild(MatMenu, {static: true}) menu: MatMenu;

  constructor(private actionItemProviderService: ActionItemProviderService) {
  }

  get items(): Array<MenuItem> {
    return this.configuration.items;
  }

  ngAfterViewChecked(): void {
    this.configuration.editor?.onMouseDown((ignored) => {
      this.actionItemProviderService.actionsKeywordsListen(
        this.configuration.editor,
        this.configuration.actionEditor,
        this.trigger,
        this.configuration.keywords,
      );
    });
  }

  addTextToEditor(text: string): void {
    this.actionItemProviderService.insertText(this.configuration.editor, text, this.configuration.itemType);
  }
}
