import {ImportService} from '@netgrif/petriflow';
import JSZip, {JSZipObject} from 'jszip';
import ApplicationImport, {ApplicationImportResult} from './application-import';

export default class ApplicationPackageImport {

    private readonly MANIFEST_FILE_NAME = 'manifest.xml';
    private readonly PROCESS_DIR = 'processes';

    private applicationImporter = new ApplicationImport();
    private modelImporter: ImportService;

    constructor(importService: ImportService) {
        this.modelImporter = importService;
    }

    public async processPackageFile(file: File): Promise<ApplicationImportResult> {
        if (!file) return Promise.reject('no file provided');
        const zip = await JSZip.loadAsync(file);
        let appManifestFile: JSZipObject;
        const xmlFiles: Array<JSZipObject> = [];
        zip.forEach((relativePath, file) => {
            if (file.name === this.MANIFEST_FILE_NAME || file.name.endsWith('/' + this.MANIFEST_FILE_NAME)) {
                if (appManifestFile) {
                    console.warn('multiple manifest files found, using only the first one at ', appManifestFile.name);
                    return;
                }
                console.log('found manifest.xml at: ', file.name);
                appManifestFile = file;
            }
            if (file.name.endsWith('.xml') && !file.name.includes(this.MANIFEST_FILE_NAME)) {
                console.log('found xml file at: ', file.name);
                xmlFiles.push(file);
            }
        });
        if (!appManifestFile) return Promise.reject('no manifest file found');
        const manifest = await appManifestFile.async('text');
        console.log(manifest);
        const result = this.applicationImporter.importApplicationCase(manifest);
        const appProcesses = new Set<string>(result.application.processes);
        const processes = xmlFiles.filter(file =>
            file.name.includes(this.PROCESS_DIR + '/') &&
            appProcesses.has(this.getFileName(file.name, '.xml')?.replace('.xml', '')));
        for (const process of processes) {
            const processXml = await process.async('text');
            const netResult = this.modelImporter.parseFromXml(processXml);
            result.models.push(netResult);
            if (netResult.errors.length !== 0) console.error(netResult.errors);
            // TODO ošetriť errory, vypísanie do dialogu
        }
        if (result.errors.length !== 0) return Promise.reject(result.errors);
        return result;
    }

    private getFileName(file: string, extension?: string): string | undefined {
        if (!file) return undefined;
        let parts = file.split('/');
        if (parts.length === 0) return undefined;
        parts = parts.reverse();
        if (extension) {
            return parts[0].endsWith(extension) ? parts[0] : undefined;
        }
        return parts[0];
    }

}
