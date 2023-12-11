import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {PaperComponent} from './paper.component';
import {FormBuilderModule} from '../form-builder.module';
import {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {MaterialImportModule} from '../../material-import/material-import.module';

describe('PaperComponent', () => {
    let component: PaperComponent;
    let fixture: ComponentFixture<PaperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [],
            imports: [
                FormBuilderModule,
                MaterialImportModule,
                RouterTestingModule.withRoutes([{path: 'modeler', redirectTo: ''}])
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PaperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
