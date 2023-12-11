import {Tool} from '../tools/tool';
import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {ModelExportService} from '../../services/model/model-export.service';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';

@Injectable({
    providedIn: 'root'
})
export class ExportTool extends Tool {

    constructor(
        private exportService: ModelExportService,
        private hotkeyService: HotkeysService
    ) {
        super(
            'export',
            new ControlPanelButton(
                new ControlPanelIcon('download', false, true),
                'Export as XML',
            )
        );
        this.hotkeyService.add(new Hotkey('ctrl+s', (event: KeyboardEvent): boolean => {
            event.stopPropagation();
            event.preventDefault();
            this.exportService.exportXML();
            return false;
        }));
    }

    onClick(): void {
        this.exportService.exportXML();
    }
}
