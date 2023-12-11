import {Injectable} from '@angular/core';
import {ControlPanelButton} from '../control-panel-button';
import {FileTool} from '../tools/file-tool';
import {ControlPanelIcon} from '../control-panel-icon';
import {ImportToolButtonComponent} from './import-tool-button/import-tool-button.component';
import {ModelImportService} from '../../model-import-service';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';

@Injectable({
    providedIn: 'root'
})
export class ImportTool extends FileTool {

    constructor(
        private importService: ModelImportService,
        private hotkeyService: HotkeysService
    ) {
        super(
            'import',
            new ControlPanelButton(
                new ControlPanelIcon('upload', false, true),
                'Choose an XML file to open'
            ),
            ImportToolButtonComponent
        );
        // TODO: NAB-326 implement ctrl+o
        this.hotkeyService.add(new Hotkey('ctrl+o', (event: KeyboardEvent): boolean => {
            event.stopPropagation();
            event.preventDefault();
            return false;
        }));
    }

    handleFileContent(content: string): void {
        this.importService.importFromXml(content);
    }
}
