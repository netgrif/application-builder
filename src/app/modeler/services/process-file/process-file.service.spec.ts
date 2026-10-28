import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {ProcessFileService, parseProcessPath} from './process-file.service';

describe('process file paths', () => {
    it('parses an app directory and XML filename from one process value', () => {
        expect(parseProcessPath('claims/onboarding.xml')).toEqual({
            app: 'claims',
            filename: 'onboarding.xml',
        });
    });

    it('rejects reserved manifests and unsafe or ambiguous process paths', () => {
        for (const value of [
            'claims/manifest.xml',
            '../onboarding.xml',
            'claims/../onboarding.xml',
            'claims/onboarding.xml/extra',
            'claims\\onboarding.xml',
            'claims/not-xml.json',
        ]) {
            expect(parseProcessPath(value)).withContext(value).toBeNull();
        }
    });

    it('derives a new file path from the model id for both app and filename', () => {
        const service = new ProcessFileService(null as any);

        expect((service as any).processPathForModelId('order-app')).toBe('order-app/order-app.xml');
        expect((service as any).processPathForModelId('bad/app')).toBeNull();
    });
});

describe('ProcessFileService', () => {
    let service: ProcessFileService;
    let http: HttpTestingController;

    beforeEach(() => {
        (window as any).processFilesEnabled = 'true';
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ProcessFileService],
        });
        service = TestBed.inject(ProcessFileService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('loads the XML and captures its ETag without caching', () => {
        let loaded;
        service.loadProcess('claims/onboarding.xml').subscribe(value => loaded = value);

        const request = http.expectOne('/processes/claims/onboarding.xml');
        expect(request.request.method).toBe('GET');
        expect(request.request.headers.get('Cache-Control')).toBe('no-store');
        request.flush('<net/>', {headers: {'ETag': '"revision-1"'}});

        expect(loaded).toEqual({
            app: 'claims',
            filename: 'onboarding.xml',
            xml: '<net/>',
            etag: '"revision-1"',
        });
        expect((service as any).currentProcess).toEqual(loaded);
    });

    it('recognizes the same active process path without reloading it', () => {
        service.currentProcess = {
            app: 'claims',
            filename: 'onboarding.xml',
            xml: '<net/>',
            etag: '"revision-1"',
        };

        expect((service as any).isCurrentProcess('claims/onboarding.xml')).toBeTrue();
        expect((service as any).isCurrentProcess('claims/another.xml')).toBeFalse();
        expect((service as any).isCurrentProcess('claims/manifest.xml')).toBeFalse();
    });

    it('lists safe app directories only', () => {
        let apps: string[];
        service.listApps().subscribe(value => apps = value);

        http.expectOne('/processes/').flush([
            {name: 'claims', type: 'directory'},
            {name: 'other.app', type: 'directory'},
            {name: '../outside', type: 'directory'},
            {name: 'manifest.xml', type: 'file'},
        ]);

        expect(apps).toEqual(['claims', 'other.app']);
    });

    it('does not call the process endpoint when storage is disabled', () => {
        (window as any).processFilesEnabled = 'false';
        let error: Error;
        service.listApps().subscribe({error: value => error = value});

        expect(error.message).toBe('Process file storage is disabled');
        http.expectNone('/processes/');
    });

    it('enables the save tool only for a literal true runtime flag', () => {
        (window as any).processFilesEnabled = undefined;
        expect(service.enabled).toBeFalse();

        (window as any).processFilesEnabled = 'false';
        expect(service.enabled).toBeFalse();

        (window as any).processFilesEnabled = 'true';
        expect(service.enabled).toBeTrue();
    });

    it('filters manifest.xml and non-XML entries from an app listing', () => {
        let files: string[];
        service.listProcesses('claims').subscribe(value => files = value);

        const request = http.expectOne('/processes/claims/');
        request.flush([
            {name: 'onboarding.xml', type: 'file'},
            {name: 'manifest.xml', type: 'file'},
            {name: 'notes.txt', type: 'file'},
            {name: 'archive', type: 'directory'},
        ]);

        expect(files).toEqual(['onboarding.xml']);
    });

    it('reports an ETag conflict without issuing a PUT', () => {
        let result;
        service.saveProcess('claims/onboarding.xml', '<net/>', '"revision-1"').subscribe(value => result = value);

        const head = http.expectOne('/processes/claims/onboarding.xml');
        expect(head.request.method).toBe('HEAD');
        head.flush(null, {headers: {'ETag': '"revision-2"'}});

        expect(result).toEqual({kind: 'conflict', reason: 'changed', currentEtag: '"revision-2"'});
        http.expectNone(request => request.method === 'PUT');
    });

    it('writes only when the current ETag still matches and refreshes it after save', () => {
        let result;
        service.saveProcess('claims/onboarding.xml', '<net/>', '"revision-1"').subscribe(value => result = value);

        http.expectOne(request => request.method === 'HEAD').flush(null, {headers: {'ETag': '"revision-1"'}});
        const put = http.expectOne(request => request.method === 'PUT');
        expect(put.request.body).toBe('<net/>');
        put.flush(null);
        http.expectOne(request => request.method === 'HEAD').flush(null, {headers: {'ETag': '"revision-2"'}});

        expect(result).toEqual({kind: 'saved', etag: '"revision-2"'});
    });

    it('creates a new process file only when the target does not exist', () => {
        let result;
        service.saveProcess('claims/new-flow.xml', '<net/>', null).subscribe(value => result = value);

        http.expectOne(request => request.method === 'HEAD').flush('missing', {
            status: 404,
            statusText: 'Not Found',
        });
        http.expectOne(request => request.method === 'PUT').flush(null);
        http.expectOne(request => request.method === 'HEAD').flush(null, {headers: {'ETag': '"revision-1"'}});

        expect(result).toEqual({kind: 'saved', etag: '"revision-1"'});
    });
});
