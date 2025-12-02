import {
    Component, ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { ChangeType, EditableAction } from '../classes/editable-action';
import { LeafNode } from '../classes/leaf-node';
import { ActionEditorService } from '../action-editor.service';
import { ActionChangedEvent } from '../action-editor-list/action-editor-list.component';

import { DialogDeleteComponent } from '../../../../dialogs/dialog-delete/dialog-delete.component';
import {
    DialogActionsAssistantComponent,
    AiAssistantDialogData,
    AiAssistantDialogResult
} from '../../../../dialogs/dialog-actions-assistant/dialog-actions-assistant.component';

import { MenuItemConfiguration } from '../action-editor-menu/action-editor-menu-item/menu-item-configuration';
import { MenuItem } from '../action-editor-menu/action-editor-menu-item/menu-item';
import { ModelService } from '../../../services/model/model.service';
import { ActionItemProviderService } from '../action-item-provider.service';

import {
    buildEditorConfigurations,
    BuiltEditorConfigs,
    findConfigForCursor,
    buildAssistantContextFromModel
} from './action-editor.helpers';

@Component({
    selector: 'nab-action-editor',
    templateUrl: './action-editor.component.html',
    styleUrls: ['./action-editor.component.scss']
})
export class ActionEditorComponent implements OnInit {

    @Input() public leafNode: LeafNode;
    @Input() public action: EditableAction;
    @Input() public index: number;
    @Input() public name: string;

    @Output() public actionChanged = new EventEmitter<ActionChangedEvent>();
    @Output() public drawerOpened = new EventEmitter<boolean>();

    @ViewChild('drawer') private drawer: MatSidenav;
    @ViewChild('matButton') private button: MatButton;
    @ViewChild('drawerBody') private drawerBodyRef: any;
    @ViewChild('referencesScroll') private referencesScrollRef?: ElementRef<HTMLDivElement>;


    public undoEnabled = false;
    public redoEnabled = false;

    public editor: any;
    public formControl = new FormControl(undefined, { updateOn: 'blur' });

    public transitionItemsConfiguration: MenuItemConfiguration;
    public dataFieldItemsConfiguration: MenuItemConfiguration;
    public behaviourItemsConfiguration: MenuItemConfiguration;
    public conditionItemsConfiguration: MenuItemConfiguration;
    public propertyItemsConfiguration: MenuItemConfiguration;
    public valueItemsConfiguration: MenuItemConfiguration;
    public typeItemsConfiguration: MenuItemConfiguration;
    public dataSetItemsConfiguration: MenuItemConfiguration;
    public processInstanceIdItemsConfiguration: MenuItemConfiguration;
    public casePredicateItemsConfiguration: MenuItemConfiguration;
    public taskPredicateItemsConfiguration: MenuItemConfiguration;

    public editorConfigurations: Array<MenuItemConfiguration> = [];

    public activePanel: 'functions' | 'references' = 'functions';
    private expandedReferenceTypes = new Set<string>();
    private keywordConfigPairs: BuiltEditorConfigs['keywordConfigPairs'] = [];

    public TRANSITION_EVENT_TYPES = ['assign', 'finish', 'cancel', 'delegate'];
    public DATA_EVENT_TYPES = ['set', 'get'];
    public PHASE_TYPES = ['pre', 'post'];

    private keywordFocusTimeoutId: any;
    private lastFocusedItemType: string | null = null;

    editorOptions = {
        language: 'petriflow',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'off',
        colorDecorators: true
    };

    constructor(
        private actionEditorService: ActionEditorService,
        private modelService: ModelService,
        private deleteDialog: MatDialog,
        private actionItemProviderService: ActionItemProviderService
    ) {}

    // ================== MONACO INIT ==================

    onInit(editorObject: any) {
        this.editor = editorObject;

        this.editor.onDidChangeModelContent(() => {
            this.saveAction(this.editor.getModel().getLinesContent().join('\n'));
        });

        this.rebindEditorsToConfigs(editorObject);
        this.initialiseEditorVersioning(editorObject);

        this.editor.onMouseDown(() => {
            setTimeout(() => this.handleKeywordFocus(), 0);
        });

        this.editor.onDidChangeCursorPosition(() => {
            this.handleKeywordFocus();
        });
    }

    private rebindEditorsToConfigs(editorObject: any) {
        const cfgs = [
            this.transitionItemsConfiguration,
            this.dataFieldItemsConfiguration,
            this.behaviourItemsConfiguration,
            this.conditionItemsConfiguration,
            this.propertyItemsConfiguration,
            this.valueItemsConfiguration,
            this.dataSetItemsConfiguration,
            this.typeItemsConfiguration,
            this.processInstanceIdItemsConfiguration,
            this.casePredicateItemsConfiguration,
            this.taskPredicateItemsConfiguration
        ].filter(Boolean) as MenuItemConfiguration[];

        cfgs.forEach(cfg => cfg.editor = editorObject);
    }

    private initialiseEditorVersioning(editorObject: any) {
        let initialVersion = editorObject.getModel().getAlternativeVersionId();
        let currentVersion = initialVersion;
        let lastVersion = initialVersion;

        this.editor.onDidChangeModelContent((e: any) => {
            const versionId = editorObject.getModel().getAlternativeVersionId();
            if (!e.isUndoing && !e.isRedoing && this.editor.getValue() === '' &&
                e.changes[0].text === '' && e.changes[0].rangeLength === 0) {
                this.undoEnabled = false;
                currentVersion = versionId;
                initialVersion = 3;
                return;
            }
            if (versionId < currentVersion) {
                this.redoEnabled = true;
                if (versionId === initialVersion) {
                    this.undoEnabled = false;
                }
            } else {
                if (versionId <= lastVersion) {
                    if (versionId === lastVersion) {
                        this.redoEnabled = false;
                    }
                } else {
                    this.redoEnabled = false;
                    if (currentVersion > lastVersion) {
                        lastVersion = currentVersion;
                    }
                }
                this.undoEnabled = true;
            }
            currentVersion = versionId;
        });
    }

    private handleKeywordFocus(): void {
        if (!this.editor || !this.keywordConfigPairs?.length) {
            return;
        }

        const cfg = findConfigForCursor(this.editor, this.keywordConfigPairs);
        if (!cfg) {
            return;
        }

        this.lastFocusedItemType = cfg.itemType;
        this.openReferencesFor(cfg);
    }


    ngOnInit(): void {
        this.formControl.setValue(this.action.definition);
        this.formControl.valueChanges.subscribe(value => this.saveAction(value));

        const built: BuiltEditorConfigs = buildEditorConfigurations(
            this.editor,
            this,
            this.modelService
        );

        this.transitionItemsConfiguration = built.transition;
        this.dataFieldItemsConfiguration = built.dataField;
        this.behaviourItemsConfiguration = built.behaviour;
        this.conditionItemsConfiguration = built.condition;
        this.propertyItemsConfiguration = built.property;
        this.valueItemsConfiguration = built.value;
        this.typeItemsConfiguration = built.type;
        this.dataSetItemsConfiguration = built.dataSet;
        this.processInstanceIdItemsConfiguration = built.processInstanceId;
        this.casePredicateItemsConfiguration = built.casePredicate;
        this.taskPredicateItemsConfiguration = built.taskPredicate;

        this.editorConfigurations = built.all;
        this.keywordConfigPairs = built.keywordConfigPairs;
        this.expandedReferenceTypes = new Set<string>();
    }

    private saveAction(value: string) {
        this.action.definition = value;
        this.action.changeType = ChangeType.EDITED;
        this.actionEditorService.saveActionChange(this.action);
    }

    deleteAction(index: number): void {
        const action = this.leafNode.removeAction(index);
        action.changeType = ChangeType.REMOVED;
        this.actionChanged.emit({ action });
    }

    actionTransitionEventsChanged(index: number): void {
        const action = this.leafNode.removeAction(index);
        action.changeType = ChangeType.MOVED;
        this.actionChanged.emit({
            triggerPath: [action.event, action.phase],
            action
        });
    }

    actionDataEventsChanged(index: number): void {
        const action = this.leafNode.removeAction(index);
        action.changeType = ChangeType.MOVED;
        this.actionChanged.emit({
            triggerPath: [action.event],
            action
        });
    }

    setHeightOnClose(index: number, action: any): void {
        const element = document.getElementById(action.event + '_' + action.phase + '_' + index) as HTMLElement;
        element.style.height = 'auto';
    }

    onResizeEvent(event: any, name: string): void {
        const newHeight = event.rectangle.height < 370 ? 370 : event.rectangle.height;
        const element = document.getElementById(name) as HTMLElement;
        const headerSize = (element.childNodes[0] as HTMLElement).offsetHeight;
        const bottomSize = (element.childNodes[1].childNodes[1] as HTMLElement).offsetHeight;
        const div = document.getElementById(name + '_div') as HTMLElement;
        const editorObject = document.getElementById(name + '_editor') as HTMLElement;
        element.style.height = newHeight + 'px';
        const innerSize = newHeight - headerSize - bottomSize - 45;
        div.style.height = innerSize + 'px';
        editorObject.style.height = innerSize + 'px';
    }

    openDialog(index: number): void {
        const dialogRef = this.deleteDialog.open(DialogDeleteComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteAction(index);
            }
        });
    }

    closeDrawer() {
        this.drawer.close();
        this.drawerOpened.emit(false);
    }

    onFunctionsButtonClick(): void {
        this.activePanel = 'functions';
        if (!this.drawer.opened) {
            this.drawer.open();
            this.drawerOpened.emit(true);
        }
    }

    onReferencesButtonClick(): void {
        this.activePanel = 'references';
        if (!this.drawer.opened) {
            this.drawer.open();
            this.drawerOpened.emit(true);
        }
    }

    onMainToggleClick(): void {
        if (this.drawer.opened) {
            this.closeDrawer();
        } else {
            this.activePanel === 'functions'
                ? this.onFunctionsButtonClick()
                : this.onReferencesButtonClick();
        }
    }

    private openReferencesFor(config: MenuItemConfiguration): void {
        const itemType = config.itemType;

        this.expandedReferenceTypes.clear();
        this.expandedReferenceTypes.add(itemType);

        // prepneme taby
        this.activePanel = 'references';

        // otvor drawer, ak je zavretý
        if (!this.drawer.opened) {
            this.drawer.open();
            this.drawerOpened.emit(true);
        }

        // počkáme na render/rozbalenie panelu a scrollneme
        setTimeout(() => {
            this.scrollReferencePanelIntoView(itemType);
        }, 0);
    }

    private scrollReferencePanelIntoView(itemType: string): void {
        const container = this.referencesScrollRef?.nativeElement;
        if (!container) {
            return;
        }

        const panel = container.querySelector<HTMLElement>(
            `mat-expansion-panel[data-type="${itemType}"]`
        );
        if (!panel) {
            return;
        }

        const header =
            panel.querySelector<HTMLElement>('.mat-expansion-panel-header') ?? panel;

        const containerRect = container.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();

        const currentScroll = container.scrollTop;
        const delta = headerRect.top - containerRect.top;

        // mierny offset aby header nebol úplne nalepený
        const offset = 4;

        const target = currentScroll + delta - offset;
        container.scrollTo({
            top: target < 0 ? 0 : target,
            behavior: 'auto', // môžeš dať 'smooth', ale 'auto' je responzívnejšie
        });
    }

    isReferenceExpanded(configuration: MenuItemConfiguration): boolean {
        return this.expandedReferenceTypes.has(configuration.itemType);
    }

    onReferencePanelOpened(configuration: MenuItemConfiguration): void {
        this.expandedReferenceTypes.add(configuration.itemType);
    }

    onReferencePanelClosed(configuration: MenuItemConfiguration): void {
        this.expandedReferenceTypes.delete(configuration.itemType);
    }

    onReferenceClick(configuration: MenuItemConfiguration, item: MenuItem): void {
        if (!this.editor) {
            return;
        }

        const token: string = (item as any).id || (item as any).title || '';
        if (!token) {
            return;
        }

        this.actionItemProviderService.insertText(
            this.editor,
            token,
            configuration.itemType
        );

        this.editor.focus();
    }

    getReferenceTitle(configuration: MenuItemConfiguration): string {
        return configuration.title;
    }

    showItemInfo(configuration: MenuItemConfiguration): boolean {
        return configuration.itemType !== 'transition' && configuration.itemType !== 'datafield';
    }

    onReferenceItemInfoClick(
        configuration: MenuItemConfiguration,
        item: MenuItem,
        event: MouseEvent
    ): void {
        event.stopPropagation();
    }

    // ================== UNDO / REDO ==================

    undo(): void {
        this.editor.trigger('undo', 'undo');
    }

    redo(): void {
        this.editor.trigger('redo', 'redo');
    }

    // ================== AI ASSISTANT ==================

    private buildAssistantContext(): string {
        return buildAssistantContextFromModel(
            this.modelService,
            {
                behaviour: this.behaviourItemsConfiguration,
                condition: this.conditionItemsConfiguration,
                property: this.propertyItemsConfiguration,
                value: this.valueItemsConfiguration,
                type: this.typeItemsConfiguration,
                dataSet: this.dataSetItemsConfiguration,
                casePredicate: this.casePredicateItemsConfiguration,
                taskPredicate: this.taskPredicateItemsConfiguration
            },
            this.action
        );
    }

    openAiAssistantDialog(): void {
        const currentCode: string = this.editor?.getValue?.() ?? this.formControl.value ?? '';

        const leafNodeId =
            (this.leafNode as any)?.id ??
            (this.leafNode as any)?.identifier ??
            (this.leafNode as any)?.visualId ??
            undefined;

        const data: AiAssistantDialogData = {
            code: currentCode,
            action: this.action,
            actionName: this.name,
            index: this.index,
            leafNodeId,
            context: this.buildAssistantContext()
        };

        const dialogRef = this.deleteDialog.open<
            DialogActionsAssistantComponent,
            AiAssistantDialogData,
            AiAssistantDialogResult
        >(DialogActionsAssistantComponent, {
            width: '960px',
            maxHeight: '90vh',
            disableClose: false,
            data
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (!result) return;
            if (typeof result.updatedCode === 'string') {
                this.formControl.setValue(result.updatedCode, { emitEvent: true });
                setTimeout(() => this.editor?.setValue?.(result.updatedCode));
            }
        });
    }
}
