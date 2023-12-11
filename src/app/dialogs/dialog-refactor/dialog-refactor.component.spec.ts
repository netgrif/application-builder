import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {DialogRefactorComponent} from './dialog-refactor.component';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ModelService} from '../../modeler/services/model.service';
import {Model} from '@netgrif/petriflow';
import {Subject} from 'rxjs';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

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
});

class MockModelService {
    model = new Model();
}
