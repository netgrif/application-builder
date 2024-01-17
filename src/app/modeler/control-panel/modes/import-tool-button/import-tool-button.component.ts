import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {FileTool} from '../../tools/file-tool';
import {NAB_CONTROL_PANEL_TOOL} from '../../control-panel-tool-injection-token';

@Component({
    selector: 'nab-import-tool-button',
    templateUrl: './import-tool-button.component.html',
    styleUrls: ['./import-tool-button.component.scss']
})
export class ImportToolButtonComponent {

    @ViewChild('xmlFileInput') fileInput: ElementRef;

    constructor(
        @Inject(NAB_CONTROL_PANEL_TOOL) public tool: FileTool,
    ) {
    }

    onClick($event: Event): void {
        $event.stopPropagation();
        this.tool.onEvent($event);
        this.fileInput.nativeElement.value = '';
    }
}
