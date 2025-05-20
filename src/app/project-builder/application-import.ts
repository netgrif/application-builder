import {PetriNetResult} from '@netgrif/petriflow';
import Application from './application';
import {sanitizeIdentifier} from "@angular/compiler";
import {normalize} from "./normalizer";

export interface ApplicationImportResult {
    application?: Application;
    models: Array<PetriNetResult>;
    errors: Array<string>;
    warnings?: Array<string>;
    info?: Array<string>;
}

export default class ApplicationImport {

    private static readonly PARSE_ERROR_LINE_EXTRACTION_REGEX = '(?:L|l)ine.*?(\\d+).*?(?:C|c)olumn.*?(\\d+)';

    constructor() {
    }

    // TODO asi by bolo fajn zachovať všetky údaje čo sú v application case aj keď sa nepoužívajú
    public importApplicationCase(content: string): ApplicationImportResult {
        const xml = this.parseXmlToDocument(content);
        const result = this.resolveError(xml);
        if (result.errors.length !== 0) return result;

        // id -> cases > case > dataField > id > app_id (dataField > value)
        // name -> cases > case > title | cases > case > dataField > id > name (dataField > value)
        // description -> cases > case > dataField > id > description (dataField > value)
        // version -> cases > case > dataField > id > version (dataField > value)
        // author -> cases > case > dataField > id > author (dataField > value)

        const cases = xml.getElementsByTagName('case');
        if (cases.length === 0) return {models: [], errors: ['No application cases was found.']};
        const aCase = cases.item(0);

        const app = Application.getEmpty();
        app.name = aCase.getElementsByTagName('title').item(0)?.textContent;
        const dataFields = aCase.getElementsByTagName('dataField');
        for (let i = 0; i < dataFields.length; i++) {
            const dataField = dataFields.item(i);
            const id = dataField.getElementsByTagName('id').item(0)?.textContent;
            switch (id) {
                case 'app_id':
                    app.id = normalize(dataField.getElementsByTagName('value').item(0)?.textContent, app);
                    break;
                case 'name':
                    if (!app.name) {
                        app.name = dataField.getElementsByTagName('value').item(0)?.textContent;
                    }
                    break;
                case 'description':
                    app.description = dataField.getElementsByTagName('value').item(0)?.textContent;
                    break;
                case 'version':
                    app.version = dataField.getElementsByTagName('value').item(0)?.textContent;
                    break;
                case 'author':
                    app.author = dataField.getElementsByTagName('value').item(0)?.textContent;
                    break;
                case 'processes':
                    const allowedNets = dataField.getElementsByTagName('allowedNets').item(0);
                    if (allowedNets) {
                        const values = allowedNets.getElementsByTagName('value');
                        for (let j = 0; j < values.length; j++) {
                            app.processes.push(values.item(j)?.textContent);
                        }
                    }
                    break;
            }
        }
        result.application = app;
        return result;
    }

    private parseXmlToDocument(xml: string): Document {
        let xmlDoc = new Document();
        if (window.DOMParser) {
            const parser = new DOMParser();
            xmlDoc = parser.parseFromString(xml, 'text/xml');
        }
        return xmlDoc;
    }

    private resolveError(xml: Document): ApplicationImportResult {
        const parseError = xml.getElementsByTagName('parsererror');
        if (parseError.length === 0) return {models: [], errors: []};
        let matches = parseError.item(0)?.textContent?.match(ApplicationImport.PARSE_ERROR_LINE_EXTRACTION_REGEX);
        matches = !matches ? null : matches;
        let message: string;

        if (!matches || matches.length === 0) {
            message = parseError.item(0)?.textContent;
        } else {
            message = `XML parsing error at line ${matches[1]} column ${matches[2]}`;
        }

        return {models: [], errors: [!message ? '' : message]};
    }

}
