import {Component, Inject, Input, OnInit} from '@angular/core';
import {FileTool} from '../file-tool';
import {NAB_CONTROL_PANEL_TOOL} from '../../control-panel-tool-injection-token';
import {Tool} from '../tool';

@Component({
    selector: 'nab-file-tool',
    templateUrl: './file-tool.component.html',
    styleUrls: ['./file-tool.component.scss']
})
export class FileToolComponent implements OnInit {

    constructor(@Inject(NAB_CONTROL_PANEL_TOOL) public fileTool: FileTool) {
    }

    ngOnInit(): void {
    }
}
