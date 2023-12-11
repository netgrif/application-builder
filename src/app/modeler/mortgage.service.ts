import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ImportService} from '@netgrif/petriflow';
import {ModelerTabsService} from './services/modeler-tabs.service';

@Injectable({
    providedIn: 'root'
})
export class MortgageService {

    constructor(
        private _http: HttpClient,
        private _importService: ImportService,
        private _modelerTabsService: ModelerTabsService
    ) {
    }

    loadModel() {
        this._http.get('assets/mortgage_simple.xml', {responseType: 'text'})
            .subscribe(data => {
                const modelResult = this._importService.parseFromXml(data);
                this._modelerTabsService.openTab.next(modelResult.model);
            });
    }
}
