import {Injectable} from '@angular/core';
import Application from './application';

@Injectable({
    providedIn: 'root',
})
export class DatabaseStorageService {

    constructor() {
    }

    public getAllApplications(): Array<Application> {
        return [];
    }

}
