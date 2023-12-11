import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {FieldListComponent} from './field-list.component';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {GridsterModule} from 'angular-gridster2';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {AngularResizedEventModule} from 'angular-resize-event';
import {ResizableModule} from 'angular-resizable-element';
import {RouterTestingModule} from '@angular/router/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormBuilderModule} from '../form-builder.module';

describe('FieldListComponent', () => {
    let component: FieldListComponent;
    let fixture: ComponentFixture<TestWrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [TestWrapperComponent],
            imports: [
                CommonModule,
                DragDropModule,
                GridsterModule,
                FormsModule,
                HttpClientModule,
                MaterialImportModule,
                FlexLayoutModule,
                AngularResizedEventModule,
                ResizableModule,
                RouterTestingModule,
                BrowserAnimationsModule,
                FormBuilderModule
            ],
            schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TestWrapperComponent);
        component = fixture.debugElement.children[0].componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

@Component({
    selector: 'nab-test-wrapper',
    template: '<nab-field-list ></nab-field-list><div id="ctxMenu"></div>'
})
class TestWrapperComponent {
}
