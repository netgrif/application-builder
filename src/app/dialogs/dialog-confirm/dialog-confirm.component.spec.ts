import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {DialogConfirmComponent} from './dialog-confirm.component';
import {MaterialImportModule} from '../../material-import/material-import.module';

describe('DialogConfirmComponent', () => {
    let component: DialogConfirmComponent;
    let fixture: ComponentFixture<DialogConfirmComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [DialogConfirmComponent],
            imports: [MaterialImportModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogConfirmComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
