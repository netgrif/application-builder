import {Injectable} from '@angular/core';
import {ModelService} from './model.service';
import {ExportService, PetriNet} from '@netgrif/petriflow';
import format from 'xml-formatter';
import {CanvasService} from './canvas.service';
import {MatDialog} from '@angular/material/dialog';
import {DialogDeadNetComponent} from '../../dialogs/dialog-dead-net/dialog-dead-net.component';

@Injectable({
    providedIn: 'root'
})
export class ModelExportService {

    private _downloadLink: HTMLAnchorElement;

    constructor(
        private _modelService: ModelService,
        private _exportService: ExportService,
        private _canvasService: CanvasService,
        private matDialog: MatDialog,
    ) {
    }

    private get model(): PetriNet {
        return this._modelService.model;
    }

    /**
     * Triggers a download of an XML file containing the serialised model stored in the {@link ModelService}.
     */
    public exportXML(): void {
        if (this.deadNet()) {
            const dialogRef = this.matDialog.open(DialogDeadNetComponent);
            dialogRef.afterClosed().subscribe(result => {
                if (result === true) {
                    this.exportToXml();
                }
            });
        } else {
            this.exportToXml();
        }
    }

    private exportToXml(): void {
        const serialisedModel = this._exportService.exportXml(this.model);
        const prettyModel = format(serialisedModel, {
            indentation: '\t',
            collapseContent: true
        });
        const fileName = this.resolveFileName();
        this.startDownload(prettyModel, fileName);
    }

    /**
     * Triggers a download of an SVG file containing the graphical model
     */
    public exportSvg(svg): void {
        const serializer = new XMLSerializer();
        let svgModel = serializer.serializeToString(svg);
        svgModel = svgModel.replace('<defs xmlns="">', '<defs>');
        svgModel = svgModel.replace(/&lt;!\[CDATA\[/g, '<![CDATA[');
        svgModel = svgModel.replace(/]]&gt;/g, ']]>');
        svgModel = svgModel.replace(/ _ngcontent-[\w].*?=""/g, '');
        const fileName = this.resolveFileName('svg');
        this.startDownload(svgModel, fileName);
    }

    private startDownload(serialisedModel: string, fileName: string): void {
        let xmlBlob = null;
        if (window.Blob) {
            xmlBlob = new Blob([serialisedModel], {type: 'text/plain;charset=utf-8'});
        }
        if (xmlBlob != null) {
            this._downloadLink = document.createElement('a');
            this._downloadLink.download = fileName;
            this._downloadLink.innerHTML = 'Download Model' + fileName;
            if (window.webkitURL !== undefined) {
                this._downloadLink.href = window.webkitURL.createObjectURL(xmlBlob);
            } else {
                if (window.URL.createObjectURL !== undefined) {
                    this._downloadLink.href = window.URL.createObjectURL(xmlBlob);
                    this._downloadLink.onclick = (event) => {
                        document.body.removeChild(event.target as Node);
                    };
                    this._downloadLink.style.display = 'none';
                    document.body.appendChild(this._downloadLink);
                }
            }
            this._downloadLink.click();
        }
    }

    private resolveFileName(extension = 'xml'): string {
        return `${this.model.id ? this.model.id : 'newmodel'}.${extension}`;
    }

    private deadNet(): boolean {
        const transitions = this._modelService.graphicModel.transitions;
        return transitions.every(t => {
            return !this._canvasService.enabled(t);
        });
    }
}
