import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatButton } from '@angular/material/button';
import { FormControl } from '@angular/forms';

import { MenuItemConfiguration } from '../action-editor-menu/action-editor-menu-item/menu-item-configuration';
import { MenuItem } from '../action-editor-menu/action-editor-menu-item/menu-item';
import { PetriflowFunction } from '@netgrif/petriflow';
import { actions } from '../classes/command-action';
import { ModelService } from '../../../services/model/model.service';

@Component({
    selector: 'nab-function-editor',
    templateUrl: './function-editor.component.html',
    styleUrls: ['./function-editor.component.scss']
})
export class FunctionEditorComponent implements OnInit {

    @Output() public actionChanged: EventEmitter<string>;
    @Output() public drawerOpened: EventEmitter<boolean>;

    @ViewChild('functionsDrawer') private functionsDrawer: MatSidenav;
    @ViewChild('referencesDrawer') private referencesDrawer: MatSidenav;
    @ViewChild('matButton') private button: MatButton;

    private _fn: PetriflowFunction;

    public editor: any;
    public formControl: FormControl;

    public transitionItemsConfiguration: MenuItemConfiguration;
    public dataFieldItemsConfiguration: MenuItemConfiguration;
    public behaviourItemsConfiguration: MenuItemConfiguration;
    public conditionItemsConfiguration: MenuItemConfiguration;
    public propertyItemsConfiguration: MenuItemConfiguration;
    public valueItemsConfiguration: MenuItemConfiguration;

    public editorConfigurations: Array<MenuItemConfiguration> = [];

    // Monaco options
    editorOptions = {
        language: 'petriflow',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'off',
        colorDecorators: true
    };

    constructor(
        private modelService: ModelService
    ) {
        this.formControl = new FormControl(undefined, { updateOn: 'blur' });
        this.actionChanged = new EventEmitter<string>();
        this.drawerOpened = new EventEmitter<boolean>();
    }

    get fn(): PetriflowFunction {
        return this._fn;
    }

    @Input()
    set fn(value: PetriflowFunction) {
        this._fn = value;
        if (this.formControl) {
            this.formControl.setValue(this._fn.definition);
        }
    }

    ngOnInit(): void {
        if (this._fn) {
            this.formControl.setValue(this._fn.definition);
        }

        this.formControl.valueChanges.subscribe(value => {
            this.saveAction(value);
        });

        this.transitionItemsConfiguration = new MenuItemConfiguration(
            'Transitions',
            'transition',
            ['<transition>', '<transitionId>'],
            this.editor,
            this,
            this.modelService.model.getTransitions()
                .map(t => new MenuItem(t.id, `<b>${t.id}</b> ${t.label?.value}`))
        );

        this.dataFieldItemsConfiguration = new MenuItemConfiguration(
            'Datafields',
            'datafield',
            ['<datafield>'],
            this.editor,
            this,
            this.modelService.model.getDataSet()
                .map(f => new MenuItem(f.id, `<b>${f.id}</b> ${f.title?.value}`))
        );

        this.behaviourItemsConfiguration = new MenuItemConfiguration(
            'Behaviours',
            'behaviour',
            ['<behaviour>'],
            this.editor,
            this,
            [
                new MenuItem('visible', 'visible'),
                new MenuItem('hidden', 'hidden'),
                new MenuItem('editable', 'editable'),
                new MenuItem('required', 'required'),
                new MenuItem('optional', 'optional')
            ]
        );

        this.conditionItemsConfiguration = new MenuItemConfiguration(
            'Conditions',
            'condition',
            ['<condition>'],
            this.editor,
            this,
            [
                new MenuItem('true', 'true'),
                new MenuItem('false', 'false'),
                new MenuItem('<datafield>.value == <datafield>.value', '&lt;datafield&gt;.value <b>==</b> &lt;datafield&gt;.value'),
                new MenuItem('<datafield>.value != <datafield>.value', '&lt;datafield&gt;.value <b>!=</b> &lt;datafield&gt;.value'),
                new MenuItem('<datafield>.value > <datafield>.value', '&lt;datafield&gt;.value <b>&gt;</b> &lt;datafield&gt;.value'),
                new MenuItem('<datafield>.value >= <datafield>.value', '&lt;datafield&gt;.value <b>&gt;=</b> &lt;datafield&gt;.value'),
                new MenuItem('<datafield>.value < <datafield>.value', '&lt;datafield&gt;.value <b>&lt;</b> &lt;datafield&gt;.value'),
                new MenuItem('<datafield>.value <= <datafield>.value', '&lt;datafield&gt;.value <b>&lt;=</b> &lt;datafield&gt;.value'),
                new MenuItem('<datafield>.value == <value>', '&lt;datafield&gt;.value <b>==</b> &lt;value&gt;'),
                new MenuItem('<datafield>.value != <value>', '&lt;datafield&gt;.value <b>!=</b> &lt;value&gt;'),
                new MenuItem('<datafield>.value > <value>', '&lt;datafield&gt;.value <b>&gt;</b> &lt;value&gt;'),
                new MenuItem('<datafield>.value >= <value>', '&lt;datafield&gt;.value <b>&gt;=</b> &lt;value&gt;'),
                new MenuItem('<datafield>.value < <value>', '&lt;datafield&gt;.value <b>&lt;</b> &lt;value&gt;'),
                new MenuItem('<datafield>.value <= <value>', '&lt;datafield&gt;.value <b>&lt;=</b> &lt;value&gt;')
            ]
        );

        this.propertyItemsConfiguration = new MenuItemConfiguration(
            'Properties',
            'property',
            ['<property>'],
            this.editor,
            this,
            [
                new MenuItem('"title"', 'title'),
                new MenuItem('"color"', 'color'),
                new MenuItem('"icon"', 'icon')
            ]
        );

        this.valueItemsConfiguration = new MenuItemConfiguration(
            'Values',
            'value',
            ['<value>', '<choices>', '<options>'],
            this.editor,
            this,
            [
                new MenuItem('<datafield>.value', '&lt;datafield&gt;.value'),
                new MenuItem('<datafield>.choices', '&lt;datafield&gt;.choices'),
                new MenuItem('<datafield>.options', '&lt;datafield&gt;.options'),
                new MenuItem('true', 'true'),
                new MenuItem('false', 'false'),
                new MenuItem('', 'Add new variable or value'),
                new MenuItem('[a,b,c]', 'List of objects'),
                new MenuItem('[a:a,b:b]', 'Map of objects'),
                new MenuItem('["a","b","c"]', 'List of strings'),
                new MenuItem('["a":"a","b":"b"]', 'Map of strings')
            ]
        );

        this.editorConfigurations = [
            this.transitionItemsConfiguration,
            this.dataFieldItemsConfiguration,
            this.behaviourItemsConfiguration,
            this.conditionItemsConfiguration,
            this.propertyItemsConfiguration,
            this.valueItemsConfiguration
        ];
    }

    onInit(editorObject: any) {
        this.editor = editorObject;

        this.editor.onDidChangeModelContent(() => {
            this.saveAction(this.editor.getModel().getLinesContent().join('\n'));
        });

        if (this.transitionItemsConfiguration) {
            this.transitionItemsConfiguration.editor = editorObject;
            this.dataFieldItemsConfiguration.editor = editorObject;
            this.behaviourItemsConfiguration.editor = editorObject;
            this.conditionItemsConfiguration.editor = editorObject;
            this.propertyItemsConfiguration.editor = editorObject;
            this.valueItemsConfiguration.editor = editorObject;
        }
    }

    private saveAction(value: string) {
        if (!this._fn) {
            return;
        }
        this._fn.definition = value;
        this.actionChanged.emit(value);

        actions[actions.length - 1].actions = this.modelService.model.functions.map(fn => {
            return {
                label: fn.name,
                action: `${fn.name}()`,
            };
        });
    }

    // === DRAWER CONTROLS ===

    toggleFunctionsDrawer() {
        this.functionsDrawer.toggle();
        this.drawerOpened.emit(this.functionsDrawer.opened);
    }

    toggleReferencesDrawer() {
        this.referencesDrawer.toggle();
    }

    // === REFERENCES CLICK HANDLER ===

    onReferenceItemClick(item: MenuItem) {
        if (!this.editor) {
            return;
        }

        // Veľmi pravdepodobne máš v MenuItem niečo ako .id alebo .title
        const insertText: string = (item as any).id ?? item.title ?? '';

        if (!insertText) {
            return;
        }

        const selection = this.editor.getSelection();

        this.editor.executeEdits('insert-reference', [{
            range: selection,
            text: insertText,
            forceMoveMarkers: true
        }]);

        this.editor.focus();
    }
}
