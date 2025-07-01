import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ModelImportService} from './model-import-service';

@Injectable({
    providedIn: 'root'
})
export class MortgageService {

    constructor(
        private _http: HttpClient,
        private _importService: ModelImportService,
    ) {
    }

    loadModel() {
        this._http.get('assets/mortgage_simple.xml', {responseType: 'text'})
            .subscribe(data => {
                this._importService.importFromXml(data);
            });
    }
}
