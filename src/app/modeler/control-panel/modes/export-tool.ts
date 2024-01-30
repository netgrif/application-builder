import {Tool} from '../tools/tool';
import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {ModelExportService} from '../../services/model/model-export.service';

@Injectable({
    providedIn: 'root'
})
export class ExportTool extends Tool {

    constructor(
        private exportService: ModelExportService,
    ) {
        super(
            'export',
            new ControlPanelButton(
                new ControlPanelIcon('download', false, true),
                'Export as XML',
            )
        );
    }

    onClick(): void {
        this.exportService.exportXML();
    }
}
