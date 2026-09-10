import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import type {XMLValidationError, XMLValidationResult} from 'xmllint-wasm';


//TODO:  get from petriflow
export const PETRIFLOW_SCHEMA_VERSIONS = [
    'latest',
    '1.0.9',
    '1.0.8',
    '1.0.7',
    '1.0.6',
    '1.0.5',
    '1.0.4',
    '1.0.3',
    '1.0.2',
    '1.0.1',
    '1.0.0',
] as const;

export type PetriflowSchemaVersion = typeof PETRIFLOW_SCHEMA_VERSIONS[number];

interface XmllintWorkerResponse {
    exitCode: number;
    stdout: string;
    stderr: string;
    'xmllint-wasm': boolean;
}

@Injectable({
    providedIn: 'root',
})
export class PetriflowXmlValidationService {
    static readonly SCHEMA_BASE_URL = 'https://petriflow.org';

    constructor(private httpClient: HttpClient) {
    }

    loadSchema(version: PetriflowSchemaVersion): Promise<string> {
        return firstValueFrom(this.httpClient.get(
            `${this.schemaUrl(version)}?cache=${Date.now()}`,
            {responseType: 'text'},
        ));
    }

    schemaUrl(version: PetriflowSchemaVersion): string {
        const versionPath = version === 'latest' ? '' : `/v${version}`;
        return `${PetriflowXmlValidationService.SCHEMA_BASE_URL}${versionPath}/petriflow.schema.xsd`;
    }

    validate(xml: string, schema: string): Promise<XMLValidationResult> {
        const worker = new Worker(
            new URL('assets/xmllint-wasm/xmllint-browser.mjs', document.baseURI),
            {type: 'module'},
        );
        const result = new Promise<XMLValidationResult>((resolve, reject) => {
            worker.addEventListener('message', event => {
                const data = event.data as XmllintWorkerResponse;
                if (!data || data['xmllint-wasm'] !== true) {
                    return;
                }
                const valid = this.validationSucceeded(data.exitCode);
                if (valid === undefined) {
                    reject(new Error(data.stderr));
                    return;
                }
                resolve({
                    valid,
                    normalized: data.stdout,
                    errors: valid ? [] : this.parseErrors(data.stderr),
                    rawOutput: data.stderr,
                });
            });
            worker.addEventListener('error', error => reject(error));
            worker.postMessage({
                inputFiles: [
                    {fileName: 'process.xml', contents: xml},
                    {fileName: 'petriflow.schema.xsd', contents: schema},
                ],
                args: ['--schema', 'petriflow.schema.xsd', '--noout', 'process.xml'],
                initialMemory: 256,
                maxMemory: 512,
                'xmllint-wasm': true,
            });
        });
        return result.finally(() => worker.terminate());
    }

    private validationSucceeded(exitCode: number): boolean | undefined {
        if (exitCode === 0) {
            return true;
        }
        if (exitCode === 3 || exitCode === 4) {
            return false;
        }
        return undefined;
    }

    private parseErrors(output: string): Array<XMLValidationError> {
        return output.split('\n').slice(0, -2).map(line => {
            const location = line.match(/^([^:]+):(\d+):\s*(.+)$/);
            if (location) {
                return {
                    rawMessage: line,
                    message: location[3],
                    loc: {fileName: location[1], lineNumber: Number(location[2])},
                };
            }
            return {rawMessage: line, message: line, loc: null};
        }).filter(error => !error.rawMessage.trim().endsWith(' validates'));
    }
}
