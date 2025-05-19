import {ExportService, ExportUtils, PetriNet} from "@netgrif/petriflow";
import Application from "./application";
import {ApplicationExport} from "./application-export";
import {ModelExportService} from "../modeler/services/model/model-export.service";
import JSZip from "jszip";

export class ApplicationPackageExport {

    private applicationExport: ApplicationExport;
    private _downloadLink: HTMLAnchorElement;

    constructor(exportUtils: ExportUtils,
                protected modelExportService: ModelExportService) {
        this.applicationExport = new ApplicationExport(exportUtils);
    }

    public async generatePackageFile(application: Application, models: Map<string, PetriNet>): Promise<string | void | Blob> {
        if (!application) {
            return Promise.resolve('no application provided');
        }
        const manifestXml = this.modelExportService.prettyFormat(this.applicationExport.exportManifestXml(application));
        const modelXmlMap: Map<string, string> = new Map<string, string>();
        models.forEach((v, k) => {
            modelXmlMap.set(k, this.modelExportService.exportXml(v))
        });
        const zip = this.createApplicationZip(manifestXml, modelXmlMap);
        return zip.generateAsync({ type:"blob" })
            .then(content => {
                this.startDownload(content, application.name + '.zip');
            });
    }

    private createApplicationZip(manifestXml: string, modelXmlMap: Map<string, string>): JSZip {
        const zip = new JSZip();
        zip.file("manifest.xml", manifestXml);

        const processes = zip.folder("processes");
        modelXmlMap.forEach((v, k) => {
           processes.file(k + '.xml', v);
        });

        return zip;
    }

    private startDownload(xmlBlob: Blob, fileName: string): void {
        if (xmlBlob != null) {
            this._downloadLink = document.createElement('a');
            this._downloadLink.download = fileName;
            this._downloadLink.innerHTML = 'Download Application ' + fileName;
            if (!!window.webkitURL) {
                this._downloadLink.href = window.webkitURL.createObjectURL(xmlBlob);
            } else {
                if (!!window.URL.createObjectURL) {
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


}
