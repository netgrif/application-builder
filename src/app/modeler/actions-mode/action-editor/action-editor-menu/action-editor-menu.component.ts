import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {actions, CommandAction, CommandActions} from '../classes/command-action';
import {ActionItemProviderService} from '../action-item-provider.service';
import {
    ActionEditorMenuDescriptionComponent
} from './action-editor-menu-description/action-editor-menu-description.component';
// import {editor} from 'monaco-editor';
// import ICodeEditor = editor.ICodeEditor;
import {ModelService} from '../../../services/model/model.service';

@Component({
    selector: 'nab-action-editor-menu',
    templateUrl: './action-editor-menu.component.html',
    styleUrls: ['./action-editor-menu.component.scss']
})
export class ActionEditorMenuComponent implements OnInit {

    @Input() editor: any;
    @ViewChild('accordion') accordion: ElementRef;
    @ViewChild('panel') panel: ElementRef;
    @Input() descriptionComponent: ActionEditorMenuDescriptionComponent;

    public menuItems: Array<CommandActions>;

    constructor(
        private actionItemProviderService: ActionItemProviderService,
        private modelService: ModelService
    ) {
    }

    ngOnInit(): void {
        this.menuItems = actions;
        this.menuItems[this.menuItems.length - 1].actions = this.modelService.model.functions.map(fn => {
            return {
                label: fn.name,
                action: `${fn.name}()`,
            };
        });
    }

    addTextToEditor(text: string): void {
        this.actionItemProviderService.insertText(this.editor, `${text}\n`, 'command');
    }

    handleClick(item: CommandAction): void {
        this.descriptionComponent.openDescriptionWithText(item);
    }

    onBlur($event) {
        this.descriptionComponent.closeDescription();
    }
}
