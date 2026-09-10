import {NgZone} from '@angular/core';
import {PetriNet} from '@netgrif/petriflow';
import {BehaviorSubject} from 'rxjs';
import {ModelExportService} from '../services/model/model-export.service';
import {ModelService} from '../services/model/model.service';
import {ModelImportService} from '../model-import-service';
import {PetriflowXmlValidationService} from './petriflow-xml-validation.service';
import {PetriflowXsdCompletionService} from './petriflow-xsd-completion.service';
import {XmlModeComponent} from './xml-mode.component';
import {PetriflowXmlActionCompletionService} from './petriflow-xml-action-completion.service';

describe('XmlModeComponent', () => {
    let originalMonaco: unknown;

    beforeEach(() => originalMonaco = window['monaco']);

    afterEach(() => window['monaco'] = originalMonaco);

    it('loads and validates XML when the active process changes', async () => {
        const modelSubject = new BehaviorSubject<PetriNet>(undefined);
        const modelService = {
            modelSubject,
            get model(): PetriNet {
                return modelSubject.value;
            },
        } as ModelService;
        const exportService = jasmine.createSpyObj<ModelExportService>('ModelExportService', ['exportXml']);
        exportService.exportXml.and.returnValue('<document><id>process</id></document>');
        const validationService = jasmine.createSpyObj<PetriflowXmlValidationService>(
            'PetriflowXmlValidationService',
            ['loadSchema', 'validate'],
        );
        validationService.loadSchema.and.callFake(version => Promise.resolve(`<xs:schema version="${version}"/>`));
        validationService.validate.and.resolveTo({
            valid: true,
            errors: [],
            normalized: '',
            rawOutput: '',
        });
        const importService = jasmine.createSpyObj<ModelImportService>('ModelImportService', ['applyFromXml']);
        importService.applyFromXml.and.returnValue(true);
        const completionService = jasmine.createSpyObj<PetriflowXsdCompletionService>('PetriflowXsdCompletionService', ['register']);
        const component = new XmlModeComponent(
            modelService,
            exportService,
            validationService,
            importService,
            completionService,
            {} as PetriflowXmlActionCompletionService,
            {run: callback => callback()} as NgZone,
        );
        const model = new PetriNet();
        model.id = 'process';

        component.ngOnInit();
        modelSubject.next(model);
        await validationService.loadSchema.calls.mostRecent().returnValue;
        await validationService.validate.calls.mostRecent().returnValue;

        expect(component.processId).toBe('process');
        expect(component.xml).toBe('<document><id>process</id></document>');
        expect(component.status).toBe('valid');
        expect(validationService.validate).toHaveBeenCalledOnceWith(
            component.xml,
            '<xs:schema version="latest"/>',
        );

        component.changeSchemaVersion('1.0.9');
        await validationService.loadSchema.calls.mostRecent().returnValue;
        await validationService.validate.calls.mostRecent().returnValue;

        expect(validationService.loadSchema).toHaveBeenCalledWith('1.0.9');
        expect(validationService.validate).toHaveBeenCalledWith(
            component.xml,
            '<xs:schema version="1.0.9"/>',
        );

        component.onXmlChanged('<document><id>updated</id></document>');
        component.status = 'invalid';

        expect(component.dirty).toBeTrue();
        expect(component.wellFormed).toBeTrue();
        expect(component.canSave).toBeTrue();

        component.saveChanges();

        expect(importService.applyFromXml).toHaveBeenCalledOnceWith(component.xml);
        expect(component.dirty).toBeFalse();

        component.onXmlChanged('<document>');

        expect(component.wellFormed).toBeFalse();
        expect(component.canSave).toBeFalse();

        component.ngOnDestroy();
    });

    it('opens completion after Monaco has applied an opening bracket', () => {
        const component = new XmlModeComponent(
            {} as ModelService,
            {} as ModelExportService,
            {} as PetriflowXmlValidationService,
            {} as ModelImportService,
            {} as PetriflowXsdCompletionService,
            {} as PetriflowXmlActionCompletionService,
            {} as NgZone,
        );
        const trigger = jasmine.createSpy('trigger');
        component['editor'] = {
            getModel: () => ({getValueInRange: () => '<'}),
            getPosition: () => ({lineNumber: 6, column: 3}),
            trigger,
        };
        jasmine.clock().install();

        try {
            component['triggerCompletionAtOpeningBracket']();

            expect(trigger).not.toHaveBeenCalled();

            jasmine.clock().tick(1);

            expect(trigger).toHaveBeenCalledOnceWith('petriflow-xsd', 'editor.action.triggerSuggest', {});
        } finally {
            jasmine.clock().uninstall();
        }
    });

    it('registers save as a Monaco action with the platform shortcut', () => {
        window['monaco'] = {
            KeyMod: {CtrlCmd: 2048},
            KeyCode: {KeyS: 49},
        };
        const component = new XmlModeComponent(
            {} as ModelService,
            {} as ModelExportService,
            {} as PetriflowXmlValidationService,
            {} as ModelImportService,
            {} as PetriflowXsdCompletionService,
            {} as PetriflowXmlActionCompletionService,
            {run: callback => callback()} as NgZone,
        );
        const addAction = jasmine.createSpy('addAction').and.returnValue({dispose: jasmine.createSpy('dispose')});
        component['editor'] = {addAction};

        component['registerEditorActions']();

        expect(addAction).toHaveBeenCalledOnceWith(jasmine.objectContaining({
            id: 'nab.xml.save',
            label: 'XML: Save XML changes',
            keybindings: [2048 | 49],
            keybindingContext: 'nabXmlEditor',
        }));
        const action = addAction.calls.mostRecent().args[0];
        spyOn(component, 'saveChanges');

        action.run();

        expect(component.saveChanges).toHaveBeenCalled();
    });
});
