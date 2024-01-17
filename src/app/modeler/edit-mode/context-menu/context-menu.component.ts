import {Component, OnInit} from '@angular/core';
import {MenuItem} from './menu-items/menu-item';
import {EditModeService} from '../edit-mode.service';

@Component({
    selector: 'nab-context-menu',
    templateUrl: './context-menu.component.html',
    styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent {

    public menuItems: Array<MenuItem>;

    constructor(
        private editModeService: EditModeService
    ) {
    }

    itemClick(item: MenuItem) {
        item.onClick();
        this.editModeService.contextMenuItems.next(undefined);
    }
}
