import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {EditPanelModelerComponent} from './edit-panel-modeler.component';
import {CommonModule} from '@angular/common';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {CdkImportModule} from '../../cdk-import/cdk-import.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {HotkeyModule} from 'angular2-hotkeys';
import {ResizableModule} from 'angular-resizable-element';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSortModule} from '@angular/material/sort';
import {Component, NO_ERRORS_SCHEMA} from '@angular/core';
import {ModelerModule} from '../modeler.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
describe('EditPanelModelerComponent', () => {
    let component: EditPanelModelerComponent;
    let fixture: ComponentFixture<TestWrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [TestWrapperComponent],
            imports: [
                CommonModule,
                MaterialImportModule,
                CdkImportModule,
                FlexLayoutModule,
                FormsModule,
                MatCheckboxModule,
                MatTabsModule,
                RouterModule,
                MonacoEditorModule.forRoot(),
                HotkeyModule.forRoot(),
                MatSortModule,
                ResizableModule,
                ModelerModule,
                NoopAnimationsModule
            ],
            schemas: [NO_ERRORS_SCHEMA]
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
    template: '<mat-sidenav #sidenav><nab-edit-panel-modeler [nav]="sidenav"></nab-edit-panel-modeler></mat-sidenav>'
})
class TestWrapperComponent {
}
