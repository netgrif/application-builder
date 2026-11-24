import {HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, catchError, map, of, switchMap, tap, throwError} from 'rxjs';

export interface ProcessFilePath {
    app: string;
    filename: string;
}

export interface LoadedProcessFile extends ProcessFilePath {
    xml: string;
    etag: string | null;
}

export interface ProcessListingEntry {
    name: string;
    type: 'file' | 'directory';
}

export type ProcessSaveResult =
    | { kind: 'saved'; etag: string | null }
    | { kind: 'conflict'; reason: 'changed' | 'missing' | 'exists'; currentEtag: string | null };

const PROCESS_API = '/processes';
const MANIFEST_FILENAME = 'manifest.xml';
const APP_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const PROCESS_FILENAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.xml$/;

export function parseProcessPath(value: string): ProcessFilePath | null {
    if (!value) {
        return null;
    }
    const segments = value.split('/');
    if (segments.length !== 2) {
        return null;
    }
    const [app, filename] = segments;
    if (!isValidAppName(app) || !isValidProcessFilename(filename)) {
        return null;
    }
    return {app, filename};
}

function isValidAppName(value: string): boolean {
    return APP_NAME_PATTERN.test(value);
}

function isValidProcessFilename(value: string): boolean {
    return PROCESS_FILENAME_PATTERN.test(value) && value.toLowerCase() !== MANIFEST_FILENAME;
}

@Injectable({
    providedIn: 'root'
})
export class ProcessFileService {

    private readonly noStoreHeaders = {'Cache-Control': 'no-store', Pragma: 'no-cache'};
    private _currentProcess: LoadedProcessFile | null = null;

    constructor(private http: HttpClient) {
    }

    get enabled(): boolean {
        return (window as any).processFilesEnabled === 'true';
    }

    processPathForModelId(modelId: string): string | null {
        if (!modelId) {
            return null;
        }
        const value = `${modelId}/${modelId}.xml`;
        return parseProcessPath(value) ? value : null;
    }

    get currentProcess(): LoadedProcessFile | null {
        return this._currentProcess;
    }

    set currentProcess(value: LoadedProcessFile | null) {
        this._currentProcess = value;
    }

    clearCurrentProcess(): void {
        this._currentProcess = null;
    }

    isCurrentProcess(value: string): boolean {
        const path = parseProcessPath(value);
        return !!path && this._currentProcess?.app === path.app && this._currentProcess.filename === path.filename;
    }

    listApps(): Observable<string[]> {
        return this.enabledRequest(() => this.http.get<ProcessListingEntry[]>(`${PROCESS_API}/`, {
            headers: this.noStoreHeaders,
        }).pipe(
            map(entries => entries
                .filter(entry => entry.type === 'directory' && isValidAppName(entry.name))
                .map(entry => entry.name)),
        ));
    }

    listProcesses(app: string): Observable<string[]> {
        if (!isValidAppName(app)) {
            return throwError(() => new Error('Invalid application directory name'));
        }
        return this.enabledRequest(() => this.http.get<ProcessListingEntry[]>(this.appUrl(app), {
            headers: this.noStoreHeaders,
        }).pipe(
            map(entries => entries
                .filter(entry => entry.type === 'file' && isValidProcessFilename(entry.name))
                .map(entry => entry.name)),
        ));
    }

    loadProcess(value: string): Observable<LoadedProcessFile> {
        const path = parseProcessPath(value);
        if (!path) {
            return throwError(() => new Error('Invalid process path'));
        }
        return this.enabledRequest(() => this.http.get(this.fileUrl(path), {
            headers: this.noStoreHeaders,
            observe: 'response',
            responseType: 'text',
        }).pipe(
            map(response => ({
                ...path,
                xml: response.body ?? '',
                etag: response.headers.get('ETag'),
            })),
            tap(loaded => this._currentProcess = loaded),
        ));
    }

    saveProcess(value: string, xml: string, expectedEtag: string | null): Observable<ProcessSaveResult> {
        const path = parseProcessPath(value);
        if (!path) {
            return throwError(() => new Error('Invalid process path'));
        }
        return this.enabledRequest(() => this.http.head(this.fileUrl(path), {
            headers: this.noStoreHeaders,
            observe: 'response',
        }).pipe(
            map(response => this.checkExistingFile(response, expectedEtag)),
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 404) {
                    return of(expectedEtag === null
                        ? {kind: 'saved' as const, etag: null, shouldWrite: true}
                        : {
                            kind: 'conflict' as const,
                            reason: 'missing' as const,
                            currentEtag: null,
                            shouldWrite: false
                        });
                }
                return throwError(() => error);
            }),
            switchMap(check => {
                if (!check.shouldWrite) {
                    return of({
                        kind: 'conflict' as const,
                        reason: check.reason,
                        currentEtag: check.currentEtag,
                    });
                }
                return this.http.put(this.fileUrl(path), xml, {
                    headers: {...this.noStoreHeaders, 'Content-Type': 'application/xml'},
                    observe: 'response',
                    responseType: 'text',
                }).pipe(
                    switchMap(() => this.readEtag(path).pipe(
                        map(etag => ({kind: 'saved' as const, etag})),
                        catchError(() => of({kind: 'saved' as const, etag: null})),
                    )),
                );
            }),
        ));
    }

    private checkExistingFile(response: HttpResponse<unknown>, expectedEtag: string | null) {
        const currentEtag = response.headers.get('ETag');
        if (expectedEtag === null) {
            return {kind: 'conflict' as const, reason: 'exists' as const, currentEtag, shouldWrite: false};
        }
        if (currentEtag !== expectedEtag) {
            return {kind: 'conflict' as const, reason: 'changed' as const, currentEtag, shouldWrite: false};
        }
        return {kind: 'saved' as const, etag: currentEtag, shouldWrite: true};
    }

    private readEtag(path: ProcessFilePath): Observable<string | null> {
        return this.http.head(this.fileUrl(path), {
            headers: this.noStoreHeaders,
            observe: 'response',
        }).pipe(map(response => response.headers.get('ETag')));
    }

    private enabledRequest<T>(request: () => Observable<T>): Observable<T> {
        if (!this.enabled) {
            return throwError(() => new Error('Process file storage is disabled'));
        }
        return request();
    }

    private appUrl(app: string): string {
        return `${PROCESS_API}/${encodeURIComponent(app)}/`;
    }

    private fileUrl(path: ProcessFilePath): string {
        return `${PROCESS_API}/${encodeURIComponent(path.app)}/${encodeURIComponent(path.filename)}`;
    }
}
