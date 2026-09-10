import {Injector} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {ImportService, PetriNet, Role} from '@netgrif/petriflow';
import {ApplicationService} from '../project-builder/application.service';
import {ModelImportService} from './model-import-service';
import {HistoryService} from './services/history/history.service';
import {PetriflowXmlCompatibilityService} from './petriflow-xml-compatibility.service';
import {
    SnackBarHorizontalPosition,
    SnackBarService,
    SnackBarVerticalPosition,
} from '@netgrif/components-core';

describe('ModelImportService', () => {
    let importService: jasmine.SpyObj<ImportService>;
    let snackBar: jasmine.SpyObj<MatSnackBar>;
    let dialog: jasmine.SpyObj<MatDialog>;
    let router: jasmine.SpyObj<Router>;
    let historyService: jasmine.SpyObj<HistoryService>;
    let applicationService: jasmine.SpyObj<ApplicationService>;
    let injector: jasmine.SpyObj<Injector>;
    let service: ModelImportService;
    let builderSnackBar: jasmine.SpyObj<SnackBarService>;
    let importedModel: PetriNet;

    beforeEach(() => {
        importedModel = new PetriNet();
        importedModel.id = 'imported';
        importService = jasmine.createSpyObj<ImportService>('ImportService', ['parseFromXml']);
        snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open', 'openFromComponent']);
        dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        historyService = jasmine.createSpyObj<HistoryService>('HistoryService', ['save']);
        applicationService = jasmine.createSpyObj<ApplicationService>('ApplicationService', ['addModel', 'replaceActiveModel']);
        injector = jasmine.createSpyObj<Injector>('Injector', ['get']);
        injector.get.and.returnValue(applicationService);
        importService.parseFromXml.and.returnValue({
            model: importedModel,
            errors: [],
            warnings: [],
            info: [],
        } as never);
        applicationService.replaceActiveModel.and.returnValue(true);
        applicationService.addModel.and.returnValue(true);
        builderSnackBar = jasmine.createSpyObj<SnackBarService>(
            'SnackBarService',
            ['openSuccessSnackBar', 'openWarningSnackBar'],
        );

        service = new ModelImportService(
            importService,
            snackBar,
            dialog,
            router,
            historyService,
            injector,
            new PetriflowXmlCompatibilityService(),
            builderSnackBar,
        );
    });

    it('resolves the application service lazily to avoid a startup DI cycle', () => {
        expect(injector.get).not.toHaveBeenCalled();

        service.importFromXml('<document/>');

        expect(injector.get).toHaveBeenCalledOnceWith(ApplicationService);
    });

    it('replaces the active application process when XML is imported', () => {
        service.importFromXml('<document/>');

        expect(applicationService.replaceActiveModel).toHaveBeenCalledOnceWith(importedModel);
        expect(historyService.save).toHaveBeenCalledWith(
            `Model ${importedModel.id} has been imported.`,
            importedModel,
        );
        expect(snackBar.openFromComponent).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/modeler']);
    });

    it('applies XML editor changes without leaving the XML mode', () => {
        const applied = service.applyFromXml('<document/>');

        expect(applied).toBeTrue();
        expect(applicationService.replaceActiveModel).toHaveBeenCalledOnceWith(importedModel);
        expect(historyService.save).toHaveBeenCalledWith(
            `Model ${importedModel.id} has been updated from XML.`,
            importedModel,
        );
        expect(builderSnackBar.openSuccessSnackBar).toHaveBeenCalledWith(
            'Process changes saved.',
            SnackBarVerticalPosition.BOTTOM,
            SnackBarHorizontalPosition.CENTER,
            3,
        );
        expect(snackBar.open).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('uses the Builder warning snackbar when XML is saved with diagnostics', () => {
        importService.parseFromXml.and.returnValue({
            model: importedModel,
            errors: [],
            warnings: [{message: 'warning'}],
            info: [],
        } as never);

        service.applyFromXml('<document/>');

        expect(builderSnackBar.openWarningSnackBar).toHaveBeenCalledWith(
            'Process changes saved with import diagnostics.',
            SnackBarVerticalPosition.BOTTOM,
            SnackBarHorizontalPosition.CENTER,
            3,
        );
    });

    it('preserves a global role expressed as an XSD attribute', () => {
        const role = new Role('manager');
        importedModel.addRole(role);

        service.applyFromXml('<document><role global="true"><id>manager</id><title>Manager</title></role></document>');

        expect(role.global).toBeTrue();
    });

    it('reports a failed XML editor update to its caller', () => {
        applicationService.replaceActiveModel.and.returnValue(false);

        const applied = service.applyFromXml('<document/>');

        expect(applied).toBeFalse();
    });

    it('reports an identifier collision without claiming that the import succeeded', () => {
        applicationService.replaceActiveModel.and.returnValue(false);

        service.importFromXml('<document/>');

        expect(historyService.save).not.toHaveBeenCalled();
        expect(snackBar.openFromComponent).not.toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
            `A process with identifier ${importedModel.id} already exists in this application.`,
            'Close',
            {duration: 5000},
        );
    });

    it('adds an uploaded process without replacing the active process', () => {
        service.addProcessFromXml('<document/>');

        expect(applicationService.addModel).toHaveBeenCalledOnceWith(importedModel);
        expect(applicationService.replaceActiveModel).not.toHaveBeenCalled();
        expect(historyService.save).not.toHaveBeenCalled();
        expect(snackBar.openFromComponent).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('rejects an uploaded process whose identifier already exists', () => {
        applicationService.addModel.and.returnValue(false);

        service.addProcessFromXml('<document/>');

        expect(snackBar.openFromComponent).not.toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
            `A process with identifier ${importedModel.id} already exists in this application.`,
            'Close',
            {duration: 5000},
        );
    });
});
