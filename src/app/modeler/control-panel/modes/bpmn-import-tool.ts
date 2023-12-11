import {Injectable} from '@angular/core';
import {FileTool} from '../tools/file-tool';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {ImportToolButtonComponent} from './import-tool-button/import-tool-button.component';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ModelImportService} from '../../model-import-service';

@Injectable({
    providedIn: 'root'
})
export class BpmnImportTool extends FileTool {

    constructor(
        private importService: ModelImportService,
        private http: HttpClient,
        private snackBar: MatSnackBar
    ) {
        super(
            'bpmn_import',
            new ControlPanelButton(
                new ControlPanelIcon('upload_file', false, true),
                'Choose a BPMN file to open',
            ),
            ImportToolButtonComponent
        );
    }

    handleFileContent(content: string) {
        this.http.post('https://bpmn2pn.netgrif.cloud/bpmn2pn/', content, {
            headers: {
                'Content-Type': 'text/xml;charset=US-ASCII',
            },
            responseType: 'text'
        }).pipe().subscribe((xmlContent: string) => {
            this.importService.importFromXml(xmlContent);
        }, (error: HttpErrorResponse) => {
            this.snackBar.open(error.message, 'X');
        });
    }
}
