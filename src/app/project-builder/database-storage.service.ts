import {Injectable} from '@angular/core';
import {ModelerConfig} from '../modeler/modeler-config';
import Application from './application';

export interface SavedProcess {
    id: string;
    xml: string;
}

export interface SavedApplicationSummary {
    storageId: string;
    application: Application;
    savedAt: number;
    legacy: boolean;
}

export interface SavedApplication extends SavedApplicationSummary {
    processes: Array<SavedProcess>;
}

@Injectable({
    providedIn: 'root',
})
export class DatabaseStorageService {

    static readonly STORAGE_KEY = 'nab_saved_applications_v1';
    static readonly LEGACY_STORAGE_ID = 'legacy_model_draft';

    private currentStorageId: string | undefined;

    getAllApplications(): Array<SavedApplicationSummary> {
        const applications = this.readApplications().map(application => this.toSummary(application));
        const legacyApplication = this.readLegacyApplication();
        if (legacyApplication) {
            applications.push(this.toSummary(legacyApplication));
        }
        return applications.sort((first, second) => second.savedAt - first.savedAt);
    }

    getApplication(storageId: string): SavedApplication | undefined {
        const savedApplication = storageId === DatabaseStorageService.LEGACY_STORAGE_ID
            ? this.readLegacyApplication()
            : this.readApplications().find(application => application.storageId === storageId);
        if (!savedApplication) {
            return undefined;
        }

        this.currentStorageId = savedApplication.storageId;
        return this.cloneSavedApplication(savedApplication);
    }

    saveApplication(application: Application, processes: Array<SavedProcess>): SavedApplicationSummary {
        const applications = this.readApplications();
        const migrateLegacyDraft = this.currentStorageId === DatabaseStorageService.LEGACY_STORAGE_ID;
        const storageId = !this.currentStorageId || migrateLegacyDraft
            ? this.createStorageId()
            : this.currentStorageId;
        const savedApplication: SavedApplication = {
            storageId,
            application: this.cloneApplication(application),
            processes: processes.map(process => ({...process})),
            savedAt: Date.now(),
            legacy: false,
        };
        const existingIndex = applications.findIndex(saved => saved.storageId === storageId);
        if (existingIndex === -1) {
            applications.push(savedApplication);
        } else {
            applications[existingIndex] = savedApplication;
        }
        localStorage.setItem(DatabaseStorageService.STORAGE_KEY, JSON.stringify(applications));
        this.discardLegacyDraft();
        this.currentStorageId = storageId;
        return this.toSummary(savedApplication);
    }

    startNewApplication(): void {
        const legacyApplication = this.readLegacyApplication();
        if (legacyApplication) {
            const applications = this.readApplications();
            applications.push({
                ...legacyApplication,
                storageId: this.createStorageId(),
            });
            localStorage.setItem(DatabaseStorageService.STORAGE_KEY, JSON.stringify(applications));
            this.discardLegacyDraft();
        }
        this.currentStorageId = undefined;
    }

    discardLegacyDraft(): void {
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE);
    }

    deleteApplication(storageId: string): boolean {
        if (storageId === DatabaseStorageService.LEGACY_STORAGE_ID) {
            const exists = !!this.readLegacyApplication();
            this.discardLegacyDraft();
            if (this.currentStorageId === storageId) {
                this.currentStorageId = undefined;
            }
            return exists;
        }

        const applications = this.readApplications();
        const remainingApplications = applications.filter(application => application.storageId !== storageId);
        if (remainingApplications.length === applications.length) {
            return false;
        }
        if (remainingApplications.length === 0) {
            localStorage.removeItem(DatabaseStorageService.STORAGE_KEY);
        } else {
            localStorage.setItem(DatabaseStorageService.STORAGE_KEY, JSON.stringify(remainingApplications));
        }
        if (this.currentStorageId === storageId) {
            this.currentStorageId = undefined;
        }
        return true;
    }

    private readApplications(): Array<SavedApplication> {
        const content = localStorage.getItem(DatabaseStorageService.STORAGE_KEY);
        if (!content) {
            return [];
        }
        try {
            const applications = JSON.parse(content) as Array<SavedApplication>;
            return Array.isArray(applications)
                ? applications.filter(application => !!application?.storageId && !!application?.application)
                : [];
        } catch {
            return [];
        }
    }

    private readLegacyApplication(): SavedApplication | undefined {
        const xml = localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY);
        if (!xml) {
            return undefined;
        }
        const processId = localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID) || 'recovered_process';
        const processTitle = localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE) || processId;
        const timestamp = localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP);
        const parsedTimestamp = timestamp ? Date.parse(timestamp) : Number.NaN;
        const application = new Application(processTitle, 'Recovered process draft');
        application.id = processId;
        application.processes = [processId];
        return {
            storageId: DatabaseStorageService.LEGACY_STORAGE_ID,
            application,
            processes: [{id: processId, xml}],
            savedAt: Number.isNaN(parsedTimestamp) ? Date.now() : parsedTimestamp,
            legacy: true,
        };
    }

    private toSummary(savedApplication: SavedApplication): SavedApplicationSummary {
        return {
            storageId: savedApplication.storageId,
            application: this.cloneApplication(savedApplication.application),
            savedAt: savedApplication.savedAt,
            legacy: savedApplication.legacy,
        };
    }

    private cloneSavedApplication(savedApplication: SavedApplication): SavedApplication {
        return {
            ...this.toSummary(savedApplication),
            processes: savedApplication.processes.map(process => ({...process})),
        };
    }

    private cloneApplication(source: Application): Application {
        const application = new Application(source.name, source.description, source.version);
        application.appMeta = source.appMeta;
        application.id = source.id;
        application.author = source.author;
        application.tags = [...(source.tags || [])];
        application.processes = [...(source.processes || [])];
        return application;
    }

    private createStorageId(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
}
