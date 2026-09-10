import {ExportService, I18nString, PetriNet} from '@netgrif/petriflow';
import {PetriflowXmlCompatibilityService} from '../../petriflow-xml-compatibility.service';
import {ModelService} from '../model/model.service';
import {HistoryService} from './history.service';

describe('HistoryService', () => {
    let service: HistoryService;
    let modelService: {model: PetriNet};
    let model: PetriNet;

    beforeEach(() => {
        model = new PetriNet();
        model.id = 'process';
        model.version = '1.0.0';
        model.title = new I18nString('Process');
        modelService = {model};
        service = new HistoryService(
            modelService as ModelService,
            new ExportService(),
            new PetriflowXmlCompatibilityService(),
        );
    });

    it('stores every explicit save even when the model is XML-equivalent', () => {
        service.save('Created', model);
        const lastChanged = model.lastChanged;

        service.save('Changed', model);

        expect(service.history.size).toBe(2);
        expect(service.history.memory[0].message).toBe('Created');
        expect(service.history.memory[1].message).toBe('Changed');
        expect(model.lastChanged).toBeGreaterThan(lastChanged);
    });

    it('stores a snapshot after model content changes', () => {
        service.save('Created', model);
        model.title.value = 'Updated process';

        service.save('Changed', model);

        expect(service.history.size).toBe(2);
        expect(service.history.memory[1].message).toBe('Changed');
        expect(service.history.memory[1].record.title.value).toBe('Updated process');
    });

    it('returns every recorded change for the active model', () => {
        const first = model.clone();
        const duplicate = model.clone();
        duplicate.lastChanged = first.lastChanged + 1;
        service.history.push(first, 'Created');
        service.history.push(duplicate, 'Changed');

        const changes = service.changesForModel(model.id);

        expect(changes.length).toBe(2);
        expect(changes[0].message).toBe('Created');
        expect(changes[1].message).toBe('Changed');
    });
});
