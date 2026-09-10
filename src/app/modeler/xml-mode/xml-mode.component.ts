import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {PetriNet} from '@netgrif/petriflow';
import {Subscription} from 'rxjs';
import type {XMLValidationError} from 'xmllint-wasm';
import {ModelExportService} from '../services/model/model-export.service';
import {ModelService} from '../services/model/model.service';
import {ModelImportService} from '../model-import-service';
import {
    PETRIFLOW_SCHEMA_VERSIONS,
    PetriflowSchemaVersion,
    PetriflowXmlValidationService,
} from './petriflow-xml-validation.service';
import {PetriflowXsdCompletionService} from './petriflow-xsd-completion.service';
import {PETRIFLOW_XML_LANGUAGE_ID, registerPetriflowXmlLanguage} from './petriflow-xml-language';
import {PetriflowXmlActionCompletionService} from './petriflow-xml-action-completion.service';

declare const monaco: any;

type XmlValidationStatus = 'empty' | 'loading' | 'valid' | 'invalid' | 'error';

@Component({
    selector: 'nab-xml-mode',
    templateUrl: './xml-mode.component.html',
    styleUrls: ['./xml-mode.component.scss'],
})
export class XmlModeComponent implements OnInit, OnDestroy {
    readonly schemaVersions = PETRIFLOW_SCHEMA_VERSIONS;
    readonly editorOptions = {
        language: PETRIFLOW_XML_LANGUAGE_ID,
        readOnly: false,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: {enabled: true},
        wordWrap: 'off',
        wordBasedSuggestions: false,
        suggest: {
            showWords: false,
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnCommitCharacter: false,
        autoClosingBrackets: 'never',
        snippetSuggestions: 'top',
        quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
        },
    };

    xml = '';
    processId: string;
    schemaVersion: PetriflowSchemaVersion = 'latest';
    status: XmlValidationStatus = 'empty';
    validationErrors: ReadonlyArray<XMLValidationError> = [];
    dirty = false;
    wellFormed = false;

    private editor: any;
    private modelSubscription: Subscription;
    private schemaPromise: Promise<string>;
    private schema: string;
    private completionRegistration: {dispose(): void};
    private actionCompletionRegistration: {dispose(): void};
    private completionTriggerTimer: ReturnType<typeof setTimeout>;
    private cursorRegistration: {dispose(): void};
    private typingRegistration: {dispose(): void};
    private formatRegistration: {dispose(): void};
    private editorActionRegistrations = new Array<{dispose(): void}>();
    private schemaSequence = 0;
    private originalXml = '';
    private savingXml = false;
    private validationTimer: ReturnType<typeof setTimeout>;
    private validationSequence = 0;

    constructor(
        private modelService: ModelService,
        private modelExportService: ModelExportService,
        private validationService: PetriflowXmlValidationService,
        private modelImportService: ModelImportService,
        private completionService: PetriflowXsdCompletionService,
        private actionCompletionService: PetriflowXmlActionCompletionService,
        private zone: NgZone,
    ) {
    }

    ngOnInit(): void {
        this.loadSchema();
        this.modelSubscription = this.modelService.modelSubject.subscribe(model => this.loadModel(model));
    }

    ngOnDestroy(): void {
        this.modelSubscription?.unsubscribe();
        clearTimeout(this.validationTimer);
        clearTimeout(this.completionTriggerTimer);
        this.completionRegistration?.dispose();
        this.actionCompletionRegistration?.dispose();
        this.cursorRegistration?.dispose();
        this.typingRegistration?.dispose();
        this.formatRegistration?.dispose();
        this.disposeEditorActions();
        this.clearMarkers();
    }

    onEditorInit(editor: any): void {
        this.editor = editor;
        registerPetriflowXmlLanguage(monaco);
        monaco.editor.setModelLanguage(this.editor.getModel(), PETRIFLOW_XML_LANGUAGE_ID);
        this.editor.createContextKey('nabXmlEditor', true);
        this.cursorRegistration = this.editor.onDidChangeCursorPosition(() => this.triggerCompletionAtOpeningBracket());
        this.typingRegistration = this.editor.onDidType(text => {
            if (text.endsWith('<')) {
                this.triggerCompletionAtOpeningBracket();
            }
        });
        this.registerFormatting();
        this.registerEditorActions();
        this.registerCompletion();
        this.actionCompletionRegistration = this.actionCompletionService.register();
        this.updateMarkers();
    }

    changeSchemaVersion(version: PetriflowSchemaVersion): void {
        this.schemaVersion = version;
        this.loadSchema();
        clearTimeout(this.validationTimer);
        this.validateXml();
    }

    onXmlChanged(xml: string): void {
        if (xml === this.xml) {
            return;
        }
        this.xml = xml;
        this.dirty = this.xml !== this.originalXml;
        this.wellFormed = this.isWellFormedXml(this.xml);
        this.scheduleValidation();
    }

    saveChanges(): void {
        if (!this.canSave) {
            return;
        }
        clearTimeout(this.validationTimer);
        this.savingXml = true;
        let saved: boolean;
        try {
            saved = this.modelImportService.applyFromXml(this.xml);
        } finally {
            this.savingXml = false;
        }
        if (saved) {
            this.originalXml = this.xml;
            this.dirty = false;
        }
    }

    get canSave(): boolean {
        return this.dirty && this.wellFormed;
    }

    get saveTooltip(): string {
        if (!this.dirty) {
            return 'No XML changes to save';
        }
        return this.wellFormed ? 'Save XML changes (Ctrl/Cmd+S)' : 'Fix XML syntax before saving';
    }

    revealError(error: XMLValidationError): void {
        const lineNumber = error.loc?.lineNumber ?? 1;
        this.editor?.revealLineInCenter(lineNumber);
        this.editor?.setPosition({lineNumber, column: 1});
        this.editor?.focus();
    }

    private loadModel(model: PetriNet): void {
        this.clearMarkers();
        this.validationErrors = [];
        if (this.savingXml && model) {
            this.processId = model.id;
            return;
        }
        if (!model) {
            ++this.validationSequence;
            this.processId = undefined;
            this.originalXml = '';
            this.xml = '';
            this.dirty = false;
            this.wellFormed = false;
            this.status = 'empty';
            return;
        }

        this.processId = model.id;
        this.originalXml = this.modelExportService.exportXml(model);
        this.xml = this.originalXml;
        this.dirty = false;
        this.wellFormed = true;
        this.validateXml();
    }

    private loadSchema(): void {
        const sequence = ++this.schemaSequence;
        this.schema = undefined;
        this.completionRegistration?.dispose();
        this.completionRegistration = undefined;
        this.schemaPromise = this.validationService.loadSchema(this.schemaVersion);
        this.schemaPromise.then(schema => {
            if (sequence !== this.schemaSequence) {
                return;
            }
            this.schema = schema;
            this.registerCompletion();
        }).catch(() => undefined);
    }

    private registerCompletion(): void {
        if (!this.editor || !this.schema) {
            return;
        }
        this.completionRegistration?.dispose();
        this.completionRegistration = this.completionService.register(
            this.schema,
            this.validationService.schemaUrl(this.schemaVersion),
        );
        this.triggerCompletionAtOpeningBracket();
    }

    private registerEditorActions(): void {
        if (!this.editor) {
            return;
        }
        this.disposeEditorActions();
        this.editorActionRegistrations.push(this.editor.addAction({
            id: 'nab.xml.save',
            label: 'XML: Save XML changes',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            keybindingContext: 'nabXmlEditor',
            run: () => this.zone.run(() => this.saveChanges()),
        }));
    }

    private registerFormatting(): void {
        this.formatRegistration?.dispose();
        this.formatRegistration = monaco.languages.registerDocumentFormattingEditProvider(PETRIFLOW_XML_LANGUAGE_ID, {
            provideDocumentFormattingEdits: model => {
                const xml = model.getValue();
                if (!this.isWellFormedXml(xml)) {
                    return [];
                }
                return [{
                    range: model.getFullModelRange(),
                    text: this.modelExportService.prettyFormat(xml),
                }];
            },
        });
    }

    private disposeEditorActions(): void {
        this.editorActionRegistrations.forEach(registration => registration.dispose());
        this.editorActionRegistrations = [];
    }

    private triggerCompletionAtOpeningBracket(): void {
        clearTimeout(this.completionTriggerTimer);
        this.completionTriggerTimer = setTimeout(() => {
            const model = this.editor?.getModel();
            const position = this.editor?.getPosition();
            if (!model || !position || position.column <= 1) {
                return;
            }
            const previousCharacter = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column - 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });
            if (previousCharacter === '<') {
                this.editor.trigger('petriflow-xsd', 'editor.action.triggerSuggest', {});
            }
        }, 0);
    }

    private isWellFormedXml(xml: string): boolean {
        if (!xml) {
            return false;
        }
        const document = new DOMParser().parseFromString(xml, 'application/xml');
        return document.getElementsByTagName('parsererror').length === 0;
    }

    private scheduleValidation(): void {
        clearTimeout(this.validationTimer);
        ++this.validationSequence;
        this.clearMarkers();
        this.validationErrors = [];
        this.status = this.xml ? 'loading' : 'empty';
        this.validationTimer = setTimeout(() => this.validateXml(), 400);
    }

    private validateXml(): void {
        const sequence = ++this.validationSequence;
        this.clearMarkers();
        this.validationErrors = [];
        if (!this.xml) {
            this.status = 'empty';
            return;
        }
        this.status = 'loading';
        const xml = this.xml;
        this.schemaPromise.then(schema => this.validationService.validate(xml, schema)).then(result => {
            if (sequence !== this.validationSequence) {
                return;
            }
            this.validationErrors = result.errors;
            this.status = result.valid ? 'valid' : 'invalid';
            this.updateMarkers();
        }).catch(() => {
            if (sequence === this.validationSequence) {
                this.status = 'error';
            }
        });
    }

    private updateMarkers(): void {
        const model = this.editor?.getModel();
        if (!model) {
            return;
        }
        const markers = this.validationErrors.map(error => {
            const requestedLine = error.loc?.lineNumber ?? 1;
            const lineNumber = Math.min(Math.max(requestedLine, 1), model.getLineCount());
            return {
                severity: monaco.MarkerSeverity.Error,
                message: error.message,
                startLineNumber: lineNumber,
                startColumn: 1,
                endLineNumber: lineNumber,
                endColumn: model.getLineMaxColumn(lineNumber),
            };
        });
        monaco.editor.setModelMarkers(model, 'petriflow-xsd', markers);
    }

    private clearMarkers(): void {
        const model = this.editor?.getModel();
        if (model) {
            monaco.editor.setModelMarkers(model, 'petriflow-xsd', []);
        }
    }
}
