import {Component, OnInit} from '@angular/core';
import {PetriNet} from '@netgrif/petriflow';
import {History} from '../services/history/history';
import {HistoryService} from '../services/history/history.service';
import {HistoryChange} from '../services/history/history-change';
import {DiffEditorModel} from 'ngx-monaco-editor';
import {ModelExportService} from '../services/model/model-export.service';
import {editor} from 'monaco-editor';
import ICodeEditor = editor.ICodeEditor;
import IEditorOptions = editor.IEditorOptions;
import {ModelService} from '../services/model/model.service';

@Component({
    selector: 'nab-history-mode',
    templateUrl: './history-mode.component.html',
    styleUrls: ['./history-mode.component.scss']
})
export class HistoryModeComponent implements OnInit {

    public history: History<PetriNet>;
    public selected: HistoryChange<PetriNet>;
    public modifiedModel: DiffEditorModel;
    public originalModel: DiffEditorModel;
    public editorOptions = {
        renderSideBySide: false
    };
    public editor: ICodeEditor;

    constructor(
        private historyService: HistoryService,
        private exportService: ModelExportService,
        private modelService: ModelService,
    ) {
    }

    ngOnInit(): void {
        this.history = this.historyService.history;
    }

    public select(index: number): void {
        this.selected = this.history.memory[index];
        this.modifiedModel = {
            code: this.exportService.exportXml(this.selected.record),
            language: 'xml'
        };
        let code = '';
        if (index > 0) {
            const previous = this.history.memory[index - 1];
            if (previous) {
                code = this.exportService.exportXml(previous.record);
            }
        }
        this.originalModel = {
            code: code,
            language: 'xml'
        };
    }

    public download(): void {
        this.exportService.downloadAsXml(this.selected.record);
    }

    public revert(): void {
        this.modelService.model = this.selected.record.clone();
    }

    public onEditorInit(editorObject): void {
        this.editor = editorObject;
    }

    public updateEditor(): void {
        this.editor.updateOptions(this.editorOptions as IEditorOptions);
    }
}
