import {ModelerConfig} from '../modeler/modeler-config';
import Application from './application';
import {DatabaseStorageService} from './database-storage.service';

describe('DatabaseStorageService', () => {
    let service: DatabaseStorageService;

    beforeEach(() => {
        service = new DatabaseStorageService();
        clearSavedData();
    });

    afterEach(() => {
        clearSavedData();
    });

    it('saves and restores a complete application snapshot', () => {
        const application = new Application('Service application', 'Description', '2.0.0');
        application.id = 'service_application';
        application.author = 'Tester';
        application.tags = ['service'];
        application.processes = ['car', 'car_service'];

        const summary = service.saveApplication(application, [
            {id: 'car', xml: '<document id="car"/>'},
            {id: 'car_service', xml: '<document id="car_service"/>'},
        ]);
        const restored = service.getApplication(summary.storageId);

        expect(service.getAllApplications().length).toBe(1);
        expect(restored.application).toEqual(jasmine.objectContaining({
            id: 'service_application',
            name: 'Service application',
            processes: ['car', 'car_service'],
        }));
        expect(restored.processes).toEqual([
            {id: 'car', xml: '<document id="car"/>'},
            {id: 'car_service', xml: '<document id="car_service"/>'},
        ]);
    });

    it('exposes the previous single-process draft for recovery', () => {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY, '<document id="old"/>');
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID, 'old');
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE, 'Old process');
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP, '2026-08-21T12:00:00.000Z');

        const saved = service.getAllApplications();

        expect(saved.length).toBe(1);
        expect(saved[0].legacy).toBeTrue();
        expect(saved[0].application.name).toBe('Old process');
        expect(service.getApplication(saved[0].storageId).processes).toEqual([
            {id: 'old', xml: '<document id="old"/>'},
        ]);
    });

    it('preserves the previous draft before starting a new application', () => {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY, '<document id="old"/>');
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID, 'old');
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE, 'Old process');

        service.startNewApplication();

        const saved = service.getAllApplications();
        expect(saved.length).toBe(1);
        expect(saved[0].application.name).toBe('Old process');
        expect(localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY)).toBeNull();
    });

    it('deletes one saved application without deleting the others', () => {
        const first = service.saveApplication(new Application('First'), [
            {id: 'first', xml: '<document id="first"/>'},
        ]);
        service.startNewApplication();
        const second = service.saveApplication(new Application('Second'), [
            {id: 'second', xml: '<document id="second"/>'},
        ]);

        expect(service.deleteApplication(first.storageId)).toBeTrue();

        const saved = service.getAllApplications();
        expect(saved.map(application => application.storageId)).toEqual([second.storageId]);
    });

    function clearSavedData(): void {
        localStorage.removeItem(DatabaseStorageService.STORAGE_KEY);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE);
    }
});
