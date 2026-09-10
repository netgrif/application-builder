import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {DialogRefactorComponent} from './dialog-refactor.component';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ModelService} from '../../modeler/services/model/model.service';
import {Subject} from 'rxjs';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {DataGroup, DataRef, DataType, DataVariable, PetriNet, Transition} from '@netgrif/petriflow';

describe('DialogRefactorComponent', () => {
    let component: DialogRefactorComponent;
    let fixture: ComponentFixture<DialogRefactorComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [DialogRefactorComponent],
            imports: [MaterialImportModule, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: {
                    beforeClosed() {
                        return new Subject();
                    }
                    }
                    },
                { provide: MAT_DIALOG_DATA, useValue: [] },
                { provide: ModelService, useClass: MockModelService}
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogRefactorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('keeps data-field and data-reference order when renaming a field', () => {
        const model = new PetriNet();
        ['first', 'middle', 'last'].forEach(id => model.addData(new DataVariable(id, DataType.TEXT)));
        const transition = new Transition(0, 0, 'transition');
        const group = new DataGroup('group');
        ['first', 'middle', 'last'].forEach(id => group.addDataRef(new DataRef(id)));
        transition.dataGroups = [group];
        model.addTransition(transition);
        const dialogRef = jasmine.createSpyObj<MatDialogRef<DialogRefactorComponent>>('MatDialogRef', ['close']);
        const refactor = new DialogRefactorComponent(
            dialogRef,
            {originalId: 'middle'},
            {model} as ModelService,
        );
        refactor.formControl.setValue('renamed');

        refactor.refactor();

        expect(model.getDataSet().map(data => data.id)).toEqual(['first', 'renamed', 'last']);
        expect(group.getDataRefs().map(dataRef => dataRef.id)).toEqual(['first', 'renamed', 'last']);
        expect(dialogRef.close).toHaveBeenCalled();
    });
});

class MockModelService {
    model = new PetriNet();
}
