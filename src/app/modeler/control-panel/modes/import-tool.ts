import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {AppBuilderConfigurationService} from '../../../app-builder-configuration.service';
import {TutorialService} from '../../../tutorial/tutorial-service';
import {assignPoolRoles, assignSystemPerformer, extractRoles, extractTaskIds} from '../../bpmn-mode/bpmn-conversion.util';
import {BpmnStateService} from '../../bpmn-mode/bpmn-state.service';
import {EnrichmentService} from '../../bpmn-mode/enrichment.service';
import {ModelImportService} from '../../model-import-service';
import {ModelService} from '../../services/model/model.service';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {Tool} from '../tools/tool';
import {ImportToolButtonComponent} from './import-tool-button/import-tool-button.component';

@Injectable({
    providedIn: 'root'
})
export class ImportTool extends Tool {

    private bpmn2pnUrl: string;
    private fileHandlers: Map<string, (content: string) => void>;

    constructor(
        config: AppBuilderConfigurationService,
        private importService: ModelImportService,
        private http: HttpClient,
        private snackBar: MatSnackBar,
        tutorialService: TutorialService,
        private modelService: ModelService,
        private bpmnState: BpmnStateService,
        private enrichment: EnrichmentService,
        private router: Router
    ) {
        super(
            'import',
            new ControlPanelButton(
                new ControlPanelIcon('upload', false, true),
                'Choose a file to open'
            ),
            ImportToolButtonComponent,
            tutorialService.importTool
        );
        this.bpmn2pnUrl = config.get().services?.urls?.bpmn2pn;
        this.fileHandlers = new Map();
        this.fileHandlers.set('xml', content => {
            // Pure Petriflow import — origin stays Petriflow (BPMN editor blocked).
            this.bpmnState.clear();
            this.enrichment.clear();
            this.importService.importFromXml(content);
        });
        this.fileHandlers.set('bpmn', content => {
            this.http.post(this.bpmn2pnUrl, content, {
                headers: {
                    'Content-Type': 'text/xml;charset=US-ASCII',
                },
                responseType: 'text',
            }).pipe().subscribe((xmlContent: string) => {
                // Fresh BPMN project: drop any stale enrichment, keep the original
                // BPMN diagram so the BPMN editor can show it, and mark the model as
                // BPMN-originated so it stays editable in BPMN (also after reload).
                this.enrichment.clear();
                this.bpmnState.xml = content;
                this.bpmnState.isBpmnProject = true;
                this.importService.importFromXml(xmlContent);
                const taskIds = extractTaskIds(content);
                // Recover pool/swimlane roles the bpmn2pn service drops, then
                // fall back to the system role on synthetic transitions.
                assignPoolRoles(this.modelService.model, extractRoles(content), taskIds);
                assignSystemPerformer(this.modelService.model, taskIds);
                this.modelService.modelOrigin = 'bpmn';
                // importFromXml navigates to the Petriflow edit view; for a BPMN
                // import keep the user in the BPMN editor (which shows the diagram).
                this.router.navigate(['/modeler/bpmn']);
            }, (error: HttpErrorResponse) => {
                this.snackBar.open(error.message, 'X');
            });
        });
    }

    onClick() {
    }

    public onEvent($event: Event): void {
        const file = ($event.target as HTMLInputElement).files[0];
        const extension = file.name.split('.').pop().toLowerCase()
        const reader = new FileReader();
        reader.onload = () => {
            this.handleFileContent(reader.result as string, extension);
        };
        reader.readAsText(file);
    }

    handleFileContent(content: string, extension: string): void {
        if (!this.fileHandlers.has(extension)) {
            this.snackBar.open('Unknown file type', 'X');
            return;
        }
        const handle = this.fileHandlers.get(extension)
        handle(content);
    }
}
