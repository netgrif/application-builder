import {MatDialog} from '@angular/material/dialog';
import {SnackBarService} from '@netgrif/components-core';
import {of} from 'rxjs';
import Application from '../../project-builder/application';
import {
    DatabaseStorageService,
    SavedApplicationSummary
} from '../../project-builder/database-storage.service';
import {DialogDeleteComponent} from '../dialog-delete/dialog-delete.component';
import {DialogIntroComponent} from './dialog-intro.component';

describe('DialogIntroComponent', () => {
    let component: DialogIntroComponent;
    let dialog: jasmine.SpyObj<MatDialog>;
    let storageService: jasmine.SpyObj<DatabaseStorageService>;
    let snackBarService: jasmine.SpyObj<SnackBarService>;
    let savedApplication: SavedApplicationSummary;

    beforeEach(() => {
        const application = new Application('Saved application');
        savedApplication = {
            storageId: 'saved-id',
            application,
            savedAt: Date.now(),
            legacy: false,
        };
        dialog = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
        storageService = jasmine.createSpyObj('DatabaseStorageService', [
            'deleteApplication',
            'getApplication',
            'startNewApplication',
            'discardLegacyDraft',
        ]);
        storageService.deleteApplication.and.returnValue(true);
        snackBarService = jasmine.createSpyObj('SnackBarService', [
            'openSuccessSnackBar',
            'openErrorSnackBar',
        ]);
        component = new DialogIntroComponent(
            [savedApplication],
            jasmine.createSpyObj('ApplicationService', ['createApplication']) as never,
            dialog,
            jasmine.createSpyObj('ImportService', ['parseFromXml']) as never,
            jasmine.createSpyObj('ModelService', [], {model: undefined}) as never,
            snackBarService,
            storageService,
            jasmine.createSpyObj('PetriflowXmlCompatibilityService', ['parseFromXml']) as never,
        );
    });

    it('deletes one saved application after confirmation', () => {
        dialog.open.and.returnValue({afterClosed: () => of(true)} as never);

        component.deleteSavedApplication(savedApplication);

        expect(dialog.open).toHaveBeenCalledWith(
            DialogDeleteComponent,
            jasmine.objectContaining({data: jasmine.objectContaining({confirmLabel: 'Delete'})}),
        );
        expect(storageService.deleteApplication).toHaveBeenCalledOnceWith('saved-id');
        expect(component.apps).toEqual([]);
    });

});
