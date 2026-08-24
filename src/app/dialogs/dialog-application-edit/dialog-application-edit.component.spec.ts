import {DialogApplicationEditComponent} from './dialog-application-edit.component';
import {ModelImportService} from '../../modeler/model-import-service';
import {PetriNet} from '@netgrif/petriflow';

describe('DialogApplicationEditComponent', () => {
    let component: DialogApplicationEditComponent;
    let modelImportService: jasmine.SpyObj<ModelImportService>;
    let models: Map<string, PetriNet>;

    beforeEach(() => {
        models = new Map<string, PetriNet>();
        modelImportService = jasmine.createSpyObj('ModelImportService', ['addProcessFromXml']);
        component = new DialogApplicationEditComponent(
            jasmine.createSpyObj('ApplicationService', ['addNewEmptyModel'], {models, numberOfProcesses: 1}) as never,
            jasmine.createSpyObj('ImportService', ['parseFromXml']) as never,
            jasmine.createSpyObj('ModelExportService', ['exportXml']) as never,
            jasmine.createSpyObj('MatDialog', ['open']),
            jasmine.createSpyObj('HistoryService', ['save']) as never,
            jasmine.createSpyObj('ExportUtils', ['export']) as never,
            jasmine.createSpyObj('SnackBarService', ['openErrorSnackBar']) as never,
            jasmine.createSpyObj('ModelService', [], {model: undefined}) as never,
            modelImportService,
            jasmine.createSpyObj('DatabaseStorageService', ['saveApplication']) as never,
        );
    });

    it('reads and adds every XML selected through Upload process', async () => {
        const firstFile = jasmine.createSpyObj<File>('FirstFile', ['text'], {name: 'first.xml'});
        const secondFile = jasmine.createSpyObj<File>('SecondFile', ['text'], {name: 'second.xml'});
        firstFile.text.and.resolveTo('<document id="first"/>');
        secondFile.text.and.resolveTo('<document id="second"/>');
        const input = {files: [firstFile, secondFile], value: 'selected'} as unknown as HTMLInputElement;
        const event = jasmine.createSpyObj<Event>('Event', ['stopPropagation'], {target: input});

        await component.importProcess(event);

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(firstFile.text).toHaveBeenCalled();
        expect(secondFile.text).toHaveBeenCalled();
        expect(modelImportService.addProcessFromXml.calls.allArgs()).toEqual([
            ['<document id="first"/>'],
            ['<document id="second"/>'],
        ]);
        expect(input.value).toBe('');
    });
});
