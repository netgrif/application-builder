import Application from "./application";
import {DataType, ExportUtils} from "@netgrif/petriflow";

interface DataField {
    id: string;
    type: string;
    value?: string;
    allowedNets?: string[];
}

export class ApplicationExport {

    public static readonly PETRIFLOW_CASE_SCHEMA_URL = 'https://github.com/netgrif/petriflow/blob/PF-78/petriflow.schema.xsd';
    private exportUtils: ExportUtils;
    protected xmlConstructor = document.implementation.createDocument(null, 'document', null);

    constructor(exportUtils: ExportUtils) {
        this.exportUtils = exportUtils;
    }

    public exportManifestXml(application: Application): string {
        const manifest = this.generateManifest(application);
        return new XMLSerializer().serializeToString(manifest);
    }

    private generateManifest(application: Application): Element {
        const doc = this.xmlConstructor.createElement('cases');
        doc.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        doc.setAttribute('xsi:noNamespaceSchemaLocation', ApplicationExport.PETRIFLOW_CASE_SCHEMA_URL);
        this.exportCaseElement(doc, application);
        return doc;
    }

    private exportCaseElement(doc: Element, application: Application): void {
        const caseElement = this.xmlConstructor.createElement('case');
        this.exportUtils.exportTag(caseElement, 'title', application.name);
        this.exportData(caseElement, {id: 'app_id', type: DataType.TEXT, value: application.id});
        this.exportData(caseElement, {id: 'name', type: DataType.TEXT, value: application.name});
        this.exportData(caseElement, {id: 'description', type: DataType.TEXT, value: application.description});
        this.exportData(caseElement, {id: 'version', type: DataType.TEXT, value: application.version});
        this.exportData(caseElement, {id: 'author', type: DataType.TEXT,value: application.author});
        this.exportData(caseElement, {id: 'processes', type: DataType.CASE_REF, allowedNets: application.processes});
        doc.appendChild(caseElement);
    }

    private exportData(doc: Element, data: DataField): void {
        const dataFieldElement = this.xmlConstructor.createElement('dataField');
        dataFieldElement.setAttribute('type', data.type);
        this.exportUtils.exportTag(dataFieldElement, 'id', data.id);
        this.exportUtils.exportTag(dataFieldElement, 'value', data.value ?? '');
        this.exportAllowedNets(dataFieldElement, data.allowedNets)
        this.exportUtils.exportTag(dataFieldElement, 'version', '1');
        doc.appendChild(dataFieldElement);
    }

    private exportAllowedNets(doc: Element, processes: string[]): void {
        if (!!processes) {
            const allowedNets = this.xmlConstructor.createElement('allowedNets');
            processes.forEach(process => {
                this.exportUtils.exportTag(allowedNets, 'value', process);
            });
            doc.append(allowedNets);
        }
    }
}
