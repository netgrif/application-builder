import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
    DialogProcessConflictComponent
} from '../../../dialogs/dialog-process-conflict/dialog-process-conflict.component';
import {ModelService} from '../../services/model/model.service';
import {ModelExportService} from '../../services/model/model-export.service';
import {ModelImportService} from '../../model-import-service';
import {
    ProcessFileService,
    ProcessSaveResult,
    parseProcessPath
} from '../../services/process-file/process-file.service';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {Tool} from '../tools/tool';

@Injectable({
    providedIn: 'root'
})
export class ProcessSaveTool extends Tool {

    constructor(
        private processFiles: ProcessFileService,
        private modelService: ModelService,
        private modelExportService: ModelExportService,
        private modelImportService: ModelImportService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
    ) {
        super(
            'process-save',
            new ControlPanelButton(new ControlPanelIcon('save', false, true), 'Save process file'),
        );
    }

    onClick(): void {
        const current = this.processFiles.currentProcess;
        const value = current
            ? `${current.app}/${current.filename}`
            : this.processFiles.processPathForModelId(this.modelService.model?.id);
        if (!value || !parseProcessPath(value)) {
            this.snackBar.open('The model ID cannot be used as an app and XML filename.', 'X');
            return;
        }
        this.save(value, this.modelExportService.exportXml(this.modelService.model), current?.etag ?? null);
    }

    private save(value: string, xml: string, expectedEtag: string | null): void {
        const path = parseProcessPath(value);
        if (!path) {
            return;
        }
        this.processFiles.saveProcess(value, xml, expectedEtag).subscribe({
            next: result => {
                if (result.kind === 'saved') {
                    this.processFiles.currentProcess = {...path, xml, etag: result.etag};
                    this.snackBar.open(`Saved ${value}`, undefined, {duration: 3000});
                } else {
                    this.resolveConflict(value, xml, result);
                }
            },
            error: error => this.snackBar.open(error?.message ?? 'Unable to save process file.', 'X'),
        });
    }

    private resolveConflict(value: string, xml: string, conflict: Extract<ProcessSaveResult, {
        kind: 'conflict'
    }>): void {
        this.dialog.open(DialogProcessConflictComponent, {
            data: {process: value, reason: conflict.reason},
        }).afterClosed().subscribe(choice => {
            if (choice === 'overwrite') {
                this.save(value, xml, conflict.currentEtag);
            } else if (choice === 'reload') {
                this.processFiles.loadProcess(value).subscribe({
                    next: loaded => this.modelImportService.importFromXml(loaded.xml, true, false),
                    error: error => this.snackBar.open(error?.message ?? 'Unable to reload process file.', 'X'),
                });
            }
        });
    }
}
