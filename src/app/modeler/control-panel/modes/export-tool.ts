import {Tool} from '../tools/tool';
import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {ModelExportService} from '../../services/model/model-export.service';
import {TutorialService} from '../../../tutorial/tutorial-service';

@Injectable({
    providedIn: 'root'
})
export class ExportTool extends Tool {

    constructor(
        private exportService: ModelExportService,
        tutorialService: TutorialService
    ) {
        super(
            'export',
            new ControlPanelButton(
                new ControlPanelIcon('download', false, true),
                'Export as XML',
            ),
            undefined,
            tutorialService.exportTool
        );
    }

    onClick(): void {
        this.exportService.downloadAsXml();
    }
}
