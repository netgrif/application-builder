import {Injectable} from '@angular/core';
import {Tool} from '../tools/tool';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {ModelExportService} from '../../services/model/model-export.service';
import {PetriflowCanvasService} from '@netgrif/petriflow.svg';
import {TutorialService} from '../../../tutorial/tutorial-service';

@Injectable({
    providedIn: 'root'
})
export class SvgExportTool extends Tool {

    constructor(
        private exportService: ModelExportService,
        private canvasService: PetriflowCanvasService,
        tutorialService: TutorialService
    ) {
        super(
            'svg_export',
            new ControlPanelButton(
                new ControlPanelIcon('save_as', false, true),
                'Export as SVG',
            ),
            undefined,
            tutorialService.svgExportTool
        )
    }

    onClick(): void {
        this.exportService.downloadAsSvg(this.canvasService.canvas.svg);
    }
}
