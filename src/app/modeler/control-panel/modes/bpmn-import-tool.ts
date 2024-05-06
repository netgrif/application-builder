import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AppBuilderConfigurationService} from '../../../app-builder-configuration.service';
import {ModelImportService} from '../../model-import-service';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {FileTool} from '../tools/file-tool';
import {ImportToolButtonComponent} from './import-tool-button/import-tool-button.component';

@Injectable({
    providedIn: 'root',
})
export class BpmnImportTool extends FileTool {

    private bpmn2pnUrl: string;

    constructor(
        config: AppBuilderConfigurationService,
        private importService: ModelImportService,
        private http: HttpClient,
        private snackBar: MatSnackBar,
    ) {
        super(
            'bpmn_import',
            new ControlPanelButton(
                new ControlPanelIcon('upload_file', false, true),
                'Choose a BPMN file to open',
            ),
            ImportToolButtonComponent,
        );
        this.bpmn2pnUrl = config.get().services?.urls?.bpmn2pn;
    }

    handleFileContent(content: string) {
        this.http.post(this.bpmn2pnUrl, content, {
            headers: {
                'Content-Type': 'text/xml;charset=US-ASCII',
            },
            responseType: 'text',
        }).pipe().subscribe((xmlContent: string) => {
            this.importService.importFromXml(xmlContent);
        }, (error: HttpErrorResponse) => {
            this.snackBar.open(error.message, 'X');
        });
    }
}
