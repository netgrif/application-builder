import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
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
import { InterprocessState, InterprocessStateService } from '../../../services/interprocess-state.service';

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

    public interprocess: InterprocessState | null = null;
    public interprocessNets: any[] = [];
    public selectedInterprocessNet: any | null = null;

    public externalTransitionItems: MenuItem[] = [];
    public externalDataFieldItems: MenuItem[] = [];

    editorOptions = {
        language: 'petriflow',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'off',
        colorDecorators: true
    };

    private readonly referenceIconMap: Record<string, string> = {
        transition: 'list_alt',
        datafield: 'edit',
        behaviour: 'tune',
        types: 'category',
        condition: 'rule',
        property: 'settings',
        value: '123',
        dataSet: 'table_chart',
        processInstanceId: 'fingerprint',
        casePredicate: 'filter_alt',
        taskPredicate: 'task_alt'
    };

    getReferenceIcon(itemType: string): string {
        return this.referenceIconMap[itemType] ?? 'chevron_right';
    }

    constructor(
        private actionEditorService: ActionEditorService,
        private modelService: ModelService,
        private deleteDialog: MatDialog,
        private actionItemProviderService: ActionItemProviderService,
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef,
        private interprocessState: InterprocessStateService
    ) {}

    onInit(editorObject: any) {
        this.editor = editorObject;

        this.editor.onDidChangeModelContent(() => {
            this.saveAction(this.editor.getModel().getLinesContent().join('\n'));
        });

        this.rebindEditorsToConfigs(editorObject);
        this.initialiseEditorVersioning(editorObject);

        this.ngZone.runOutsideAngular(() => {
            this.editor.onMouseUp(() => {
                this.ngZone.run(() => this.handleKeywordFocus());
            });

            this.editor.onDidChangeCursorSelection(() => {
                this.ngZone.run(() => this.handleKeywordFocus());
            });
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

    handleKeywordFocus(): void {
        if (!this.editor || !this.keywordConfigPairs?.length) {
            return;
        }

        const cfg = findConfigForCursor(this.editor, this.keywordConfigPairs);
        if (!cfg) {
            return;
        }

        if (!this.drawer.opened || this.activePanel !== 'references') {
            this.activePanel = 'references';
            this.drawer.open();
            this.drawerOpened.emit(true);
        }

        this.openReferencesFor(cfg);
        this.cdr.markForCheck();
    }

    ngOnInit(): void {
        this.formControl.setValue(this.action.definition);
        this.formControl.valueChanges.subscribe(value => this.saveAction(value));

        const built: BuiltEditorConfigs = buildEditorConfigurations(
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
        this.expandedReferenceTypes = built.defaultExpandedTypes;

        this.interprocessState.state$.subscribe((state) => {
            this.interprocess = state;
            this.interprocessNets = state?.interprocess?.data?.nets ?? [];
            this.updateProcessInstanceIds();
            this.cdr.markForCheck();
        });
    }

    private updateProcessInstanceIds(): void {
        if (!this.processInstanceIdItemsConfiguration) {
            return;
        }

        const nets = this.interprocessNets || [];

        const seen = new Set<string>();
        const items = nets
            .map((net: any) => {
                const id = net.identifier
                if (!id || seen.has(id)) {
                    return null;
                }
                seen.add(id);

                const title = net.identifier
                return new MenuItem(id, title);
            })
            .filter((x): x is MenuItem => !!x);

        (this.processInstanceIdItemsConfiguration as any).items = items;
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

    setHeightOnClose(index: number, action: any): void {
        const element = document.getElementById(action.event + '_' + action.phase + '_' + index) as HTMLElement;
        element.style.height = 'auto';
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

        setTimeout(() => this.scrollReferencePanelIntoView(itemType), 0);
        setTimeout(() => this.scrollReferencePanelIntoView(itemType), 60);
    }

    private scrollReferencePanelIntoView(itemType: string): void {
        if (!this.referencesScrollRef) {
            return;
        }

        const container = this.referencesScrollRef.nativeElement;

        const panel = container.querySelector<HTMLElement>(
            `mat-expansion-panel[data-type="${itemType}"]`
        );
        if (!panel) {
            return;
        }

        const header =
            panel.querySelector<HTMLElement>('.mat-expansion-panel-header') ?? panel;

        const headerOffset = 4;
        const targetTop = header.offsetTop - headerOffset;

        container.scrollTo({
            top: targetTop < 0 ? 0 : targetTop,
            behavior: 'auto'
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

        const id: string = (item as any).id || '';
        const value: string = (item as any).value || '';
        const title: string = (item as any).title || '';

        const token: string = id || value || title || '';
        if (!token) {
            return;
        }

        if (!this.usingCurrentProcess &&
            (configuration.itemType === 'transition' || configuration.itemType === 'datafield')) {

            const model = this.editor.getModel();
            const selection = this.editor.getSelection();
            const position = this.editor.getPosition();

            if (model && position) {
                let range = selection;

                if (!range || range.isEmpty()) {
                    const lineText = model.getLineContent(position.lineNumber);
                    const cursorIndex = position.column - 1;

                    let kwRange: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } | null = null;

                    for (const kw of configuration.keywords || []) {
                        let idx = lineText.indexOf(kw);
                        while (idx !== -1) {
                            const end = idx + kw.length;
                            if (cursorIndex >= idx && cursorIndex <= end) {
                                kwRange = {
                                    startLineNumber: position.lineNumber,
                                    startColumn: idx + 1,
                                    endLineNumber: position.lineNumber,
                                    endColumn: end + 1
                                };
                                break;
                            }
                            idx = lineText.indexOf(kw, idx + 1);
                        }
                        if (kwRange) {
                            break;
                        }
                    }

                    if (kwRange) {
                        range = kwRange as any;
                    } else {
                        range = {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        } as any;
                    }
                }

                this.editor.executeEdits('external-ref', [
                    {
                        range,
                        text: id || token,
                        forceMoveMarkers: true
                    }
                ]);
            }

            this.editor.focus();
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

    undo(): void {
        this.editor.trigger('undo', 'undo');
    }

    redo(): void {
        this.editor.trigger('redo', 'redo');
    }

    get usingCurrentProcess(): boolean {
        return this.selectedInterprocessNet === null;
    }

    onProcessSelect(value: any): void {
        if (value === 'current') {
            this.selectedInterprocessNet = null;
            this.externalTransitionItems = [];
            this.externalDataFieldItems = [];
            console.log('%c[ActionEditor] Using CURRENT process', 'color: green; font-weight: bold;');
        } else {
            this.selectedInterprocessNet = value;

            console.log(
                '%c[ActionEditor] Selected external process:',
                'color: #3f51b5; font-weight: bold;',
                value.identifier
            );

            const transitionsSource = Object.values(value.transitions || {});
            const dataFieldsSource = Object.values(value.dataSet || {});

            this.externalTransitionItems = transitionsSource.map((t: any) =>
                new MenuItem(t.id, `${t.title ?? t.id}`)
            );

            this.externalDataFieldItems = dataFieldsSource.map((d: any) =>
                new MenuItem(d.id, `${d.title ?? d.id}`)
            );
        }

        this.cdr.markForCheck();
    }

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

    getReferenceLabel(item: MenuItem): string {
        const title = (item as any).title ?? '';
        if (!title) {
            return (item as any).id ?? '';
        }
        return title;
    }

    getReferenceId(item: MenuItem): string {
        const id = (item as any).id ?? '';
        if (!id) {
            return '';
        }
        if (id.length <= 12) {
            return id;
        }
        return id.slice(0, 9) + '…';
    }

    getReferenceTooltip(configuration: MenuItemConfiguration, item: MenuItem): string {
        const id = (item as any).id ?? '';
        const label = this.getReferenceLabel(item);
        if (!id) {
            return label;
        }
        return `${label} [${id}]`;
    }
}
