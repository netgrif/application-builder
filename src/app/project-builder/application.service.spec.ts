import {MatDialog} from '@angular/material/dialog';
import {I18nString, PetriNet} from '@netgrif/petriflow';
import {BehaviorSubject, of} from 'rxjs';
import {HistoryService} from '../modeler/services/history/history.service';
import {ModelService} from '../modeler/services/model/model.service';
import {SimulationModeService} from '../modeler/simulation-mode/simulation-mode.service';
import Application from './application';
import {ApplicationService} from './application.service';

class ModelServiceStub {
    modelSubject = new BehaviorSubject<PetriNet>(undefined);
    model: PetriNet;
    newModel = jasmine.createSpy('newModel');
}

describe('ApplicationService', () => {
    let service: ApplicationService;
    let modelService: ModelServiceStub;
    let historyService: jasmine.SpyObj<HistoryService>;
    let dialog: jasmine.SpyObj<MatDialog>;
    let simulationModeService: jasmine.SpyObj<SimulationModeService>;
    let generatedModel: PetriNet;

    const createModel = (id: string): PetriNet => {
        const model = new PetriNet();
        model.id = id;
        model.title = new I18nString(id);
        return model;
    };

    beforeEach(() => {
        generatedModel = createModel('new-model');
        modelService = new ModelServiceStub();
        modelService.newModel.and.returnValue(generatedModel);
        historyService = jasmine.createSpyObj<HistoryService>('HistoryService', ['save']);
        dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
        dialog.open.and.returnValue({afterClosed: () => of(true)} as never);
        const originalModel = new BehaviorSubject<PetriNet>(undefined);
        spyOn(originalModel, 'next').and.callThrough();
        simulationModeService = jasmine.createSpyObj<SimulationModeService>('SimulationModeService', [], {
            originalModel,
        });

        service = new ApplicationService(
            modelService as unknown as ModelService,
            historyService,
            dialog,
            simulationModeService,
        );
        service.application = Application.getEmpty();
    });

    it('creates an application with its initial model tracked and active', () => {
        service.createApplication();

        expect(service.models.size).toBe(1);
        expect(service.models.get(generatedModel.id)).toBe(generatedModel);
        expect(modelService.model).toBe(generatedModel);
        expect(service.application.processes).toEqual([generatedModel.id]);
    });

    it('deletes the process selected in the application dialog', () => {
        const activeModel = createModel('active');
        const selectedModel = createModel('selected');
        service.models.set(activeModel.id, activeModel);
        service.models.set(selectedModel.id, selectedModel);
        service.updateProcesses();
        modelService.model = activeModel;
        historyService.save.calls.reset();

        service.removeModel(selectedModel.id);

        expect(service.models.has(selectedModel.id)).toBeFalse();
        expect(service.models.get(activeModel.id)).toBe(activeModel);
        expect(modelService.model).toBe(activeModel);
        expect(historyService.save).toHaveBeenCalledWith(
            `Model ${selectedModel.id} has been deleted.`,
            selectedModel,
        );
    });

    it('leaves the application empty after deleting its last process', () => {
        const deletedModel = createModel('only-process');
        service.models.set(deletedModel.id, deletedModel);
        service.updateProcesses();
        modelService.model = deletedModel;

        service.removeModel(deletedModel.id);

        expect(service.models.size).toBe(0);
        expect(service.models.has(deletedModel.id)).toBeFalse();
        expect(modelService.model).toBeUndefined();
        expect(service.application.processes).toEqual([]);
        expect(modelService.newModel).not.toHaveBeenCalled();
        expect(simulationModeService.originalModel.next).toHaveBeenCalledWith(undefined);
    });

    it('removes the last listed process even if an old untracked placeholder is active', () => {
        const listedModel = createModel('listed-process');
        const untrackedModel = createModel('untracked-placeholder');
        service.models.set(listedModel.id, listedModel);
        service.updateProcesses();
        modelService.model = untrackedModel;

        service.removeModel(listedModel.id);

        expect(service.models.size).toBe(0);
        expect(service.models.has(listedModel.id)).toBeFalse();
        expect(modelService.model).toBeUndefined();
        expect(modelService.newModel).not.toHaveBeenCalled();
    });

    it('activates a process explicitly added to an empty application', () => {
        modelService.model = undefined;

        const addedModel = service.addNewEmptyModel();

        expect(addedModel).toBe(generatedModel);
        expect(service.models.get(generatedModel.id)).toBe(generatedModel);
        expect(modelService.model).toBe(generatedModel);
        expect(service.application.processes).toEqual([generatedModel.id]);
        expect(simulationModeService.originalModel.next).toHaveBeenCalledWith(generatedModel);
    });

    it('does not create a history entry when switching the active process', () => {
        const firstModel = createModel('first');
        const secondModel = createModel('second');
        service.models.set(firstModel.id, firstModel);
        service.models.set(secondModel.id, secondModel);
        service.updateProcesses();
        modelService.model = firstModel;

        service.switchActiveModel(secondModel.id);

        expect(modelService.model).toBe(secondModel);
        expect(historyService.save).not.toHaveBeenCalled();
        expect(simulationModeService.originalModel.next).toHaveBeenCalledWith(secondModel);
    });

    it('does not overwrite a process when an added identifier already exists', () => {
        const existingModel = createModel('existing');
        const duplicateModel = createModel(existingModel.id);
        service.addModel(existingModel);
        historyService.save.calls.reset();

        const added = service.addModel(duplicateModel);

        expect(added).toBeFalse();
        expect(service.models.size).toBe(1);
        expect(service.models.get(existingModel.id)).toBe(existingModel);
        expect(historyService.save).not.toHaveBeenCalled();
    });

    it('adds and activates an imported model in an empty application', () => {
        const importedModel = createModel('imported');

        const replaced = service.replaceActiveModel(importedModel);

        expect(replaced).toBeTrue();
        expect([...service.models.keys()]).toEqual([importedModel.id]);
        expect(modelService.model).toBe(importedModel);
        expect(service.application.processes).toEqual([importedModel.id]);
    });

    it('replaces the active process with an imported model and preserves its menu position', () => {
        const activeModel = createModel('active');
        const untouchedModel = createModel('untouched');
        const importedModel = createModel('imported');
        service.models.set(activeModel.id, activeModel);
        service.models.set(untouchedModel.id, untouchedModel);
        service.updateProcesses();
        modelService.model = activeModel;

        const replaced = service.replaceActiveModel(importedModel);

        expect(replaced).toBeTrue();
        expect([...service.models.keys()]).toEqual([importedModel.id, untouchedModel.id]);
        expect(service.models.get(importedModel.id)).toBe(importedModel);
        expect(service.models.has(activeModel.id)).toBeFalse();
        expect(modelService.model).toBe(importedModel);
        expect(service.application.processes).toEqual([importedModel.id, untouchedModel.id]);
        expect(simulationModeService.originalModel.next).toHaveBeenCalledWith(importedModel);
    });

    it('renames a process without moving it in the menu', () => {
        const firstModel = createModel('first');
        const renamedModel = createModel('middle');
        const lastModel = createModel('last');
        service.models.set(firstModel.id, firstModel);
        service.models.set(renamedModel.id, renamedModel);
        service.models.set(lastModel.id, lastModel);
        service.updateProcesses();

        const renamed = service.updateModelId('middle', 'renamed');

        expect(renamed).toBeTrue();
        expect([...service.models.keys()]).toEqual(['first', 'renamed', 'last']);
        expect(service.models.get('renamed')).toBe(renamedModel);
        expect(service.application.processes).toEqual(['first', 'renamed', 'last']);
    });

    it('rejects a process rename that would overwrite another process', () => {
        const firstModel = createModel('first');
        const secondModel = createModel('second');
        service.models.set(firstModel.id, firstModel);
        service.models.set(secondModel.id, secondModel);
        service.updateProcesses();

        const renamed = service.updateModelId('first', 'second');

        expect(renamed).toBeFalse();
        expect([...service.models.keys()]).toEqual(['first', 'second']);
        expect(service.models.get('first')).toBe(firstModel);
        expect(service.models.get('second')).toBe(secondModel);
    });

    it('updates an active process atomically without changing its position', () => {
        const firstModel = createModel('first');
        const activeModel = createModel('active');
        const lastModel = createModel('last');
        const editedModel = createModel('renamed');
        service.models.set(firstModel.id, firstModel);
        service.models.set(activeModel.id, activeModel);
        service.models.set(lastModel.id, lastModel);
        service.updateProcesses();
        modelService.model = activeModel;

        const updated = service.updateModel(activeModel.id, editedModel);

        expect(updated).toBeTrue();
        expect([...service.models.keys()]).toEqual(['first', 'renamed', 'last']);
        expect(modelService.model).toBe(editedModel);
        expect(simulationModeService.originalModel.next).toHaveBeenCalledWith(editedModel);
    });

    it('updates a non-active process without switching the active process', () => {
        const activeModel = createModel('active');
        const otherModel = createModel('other');
        const editedModel = createModel('renamed-other');
        service.models.set(activeModel.id, activeModel);
        service.models.set(otherModel.id, otherModel);
        service.updateProcesses();
        modelService.model = activeModel;

        const updated = service.updateModel(otherModel.id, editedModel);

        expect(updated).toBeTrue();
        expect([...service.models.keys()]).toEqual(['active', 'renamed-other']);
        expect(modelService.model).toBe(activeModel);
    });

    it('replaces the sole listed process when an old untracked placeholder is active', () => {
        const listedModel = createModel('listed-process');
        const untrackedModel = createModel('untracked-placeholder');
        const importedModel = createModel('imported');
        service.models.set(listedModel.id, listedModel);
        service.updateProcesses();
        modelService.model = untrackedModel;

        const replaced = service.replaceActiveModel(importedModel);

        expect(replaced).toBeTrue();
        expect([...service.models.keys()]).toEqual([importedModel.id]);
        expect(service.models.has(listedModel.id)).toBeFalse();
        expect(modelService.model).toBe(importedModel);
    });

    it('does not overwrite another process when an imported identifier already exists', () => {
        const activeModel = createModel('active');
        const existingModel = createModel('existing');
        const importedModel = createModel(existingModel.id);
        service.models.set(activeModel.id, activeModel);
        service.models.set(existingModel.id, existingModel);
        service.updateProcesses();
        modelService.model = activeModel;

        const replaced = service.replaceActiveModel(importedModel);

        expect(replaced).toBeFalse();
        expect([...service.models.keys()]).toEqual([activeModel.id, existingModel.id]);
        expect(service.models.get(existingModel.id)).toBe(existingModel);
        expect(modelService.model).toBe(activeModel);
    });
});
