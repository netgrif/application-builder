import {Component, OnDestroy, OnInit} from '@angular/core';
import {HistoryMasterDetailService} from '../history-master-detail.service';
import {HistoryService} from '../../services/history/history.service';
import {ModelExportService} from '../../services/model/model-export.service';
import {DiffEditorModel} from 'ngx-monaco-editor-v2';
import {Subscription} from 'rxjs';

@Component({
    selector: 'nab-history-detail',
    templateUrl: './history-detail.component.html',
    styleUrl: './history-detail.component.scss'
})
export class HistoryDetailComponent implements OnInit, OnDestroy {

    public modifiedModel: DiffEditorModel;
    public originalModel: DiffEditorModel;
    public editorOptions = {
        renderSideBySide: false,
        readOnly: true
    };
    public editor: any;
    protected subSelect: Subscription;

    constructor(private historyService: HistoryService,
                private exportService: ModelExportService,
                private masterService: HistoryMasterDetailService) {
    }

    ngOnInit() {
        this.subSelect = this.masterService.getSelected$().subscribe(selected => {
            if (selected !== undefined) {
                this.modifiedModel = {
                    code: this.exportService.exportXml(selected.record),
                    language: 'xml',
                };
                let code = '';
                const index = this.masterService.allData.findIndex(item => item === selected);
                if (index > 0) {
                    const previous = this.masterService.allData[index - 1];
                    if (previous) {
                        code = this.exportService.exportXml(previous.record);
                    }
                }
                this.originalModel = {
                    code: code,
                    language: 'xml',
                };
                setTimeout(() => {
                    this.updateEditor();
                });
            }
        })
    }

    public download(): void {
        this.exportService.downloadAsXml(this.masterService.getSelected().record);
    }

    public revert(): void {
        this.historyService.reload(this.masterService.getSelected().record);
    }

    public onEditorInit(editorObject: any): void {
        this.editor = editorObject;
    }

    public updateEditor(): void {
        if (this.editor) {
            this.editor.updateOptions(this.editorOptions as any);
        }
    }

    public getSelected() {
        return this.masterService.getSelected();
    }

    ngOnDestroy() {
        this.subSelect.unsubscribe();
    }
}
