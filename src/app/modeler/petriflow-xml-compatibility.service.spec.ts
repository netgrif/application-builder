import {ImportService, PetriNet, Role} from '@netgrif/petriflow';
import {PetriflowXmlCompatibilityService} from './petriflow-xml-compatibility.service';

describe('PetriflowXmlCompatibilityService', () => {
    let service: PetriflowXmlCompatibilityService;

    beforeEach(() => service = new PetriflowXmlCompatibilityService());

    it('removes a false legacy global element from exported roles', () => {
        const xml = service.normalizeExport(
            '<document><role><id>customer</id><title>Customer</title><global>false</global></role></document>',
        );

        expect(xml).toBe('<document><role><id>customer</id><title>Customer</title></role></document>');
    });

    it('exports a true role global value as an XSD attribute', () => {
        const xml = service.normalizeExport(
            '<document><role><id>manager</id><title>Manager</title><global>true</global></role></document>',
        );

        expect(xml).toBe('<document><role global="true"><id>manager</id><title>Manager</title></role></document>');
    });

    it('preserves a role global attribute when XML is imported', () => {
        const model = new PetriNet();
        const role = new Role('manager');
        model.addRole(role);

        service.applyRoleGlobals(
            '<document><role global="true"><id>manager</id><title>Manager</title></role></document>',
            model,
        );

        expect(role.global).toBeTrue();
    });

    it('applies role attributes through the shared import path', () => {
        const model = new PetriNet();
        const role = new Role('manager');
        const importService = jasmine.createSpyObj<ImportService>('ImportService', ['parseFromXml']);
        model.addRole(role);
        importService.parseFromXml.and.returnValue({model, errors: [], warnings: [], info: []} as never);

        const result = service.parseFromXml(
            importService,
            '<document><role global="true"><id>manager</id><title>Manager</title></role></document>',
        );

        expect(result.model).toBe(model);
        expect(role.global).toBeTrue();
    });
});
