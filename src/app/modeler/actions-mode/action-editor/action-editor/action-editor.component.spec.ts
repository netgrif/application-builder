import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {ActionEditorComponent} from './action-editor.component';
import {CommonModule} from '@angular/common';
import {MaterialImportModule} from '../../../../material-import/material-import.module';
import {CdkImportModule} from '../../../../cdk-import/cdk-import.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {HotkeyModule} from 'angular2-hotkeys';
import {ResizableModule} from 'angular-resizable-element';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSortModule} from '@angular/material/sort';
import {Component} from '@angular/core';
import {ActionType, EditableAction} from '../classes/editable-action';

describe('ActionEditorComponent', () => {
    let component: ActionEditorComponent;
    let fixture: ComponentFixture<TestWrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ActionEditorComponent, TestWrapperComponent],
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
                ResizableModule
            ]
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
    template: '<nab-action-editor [action]="action" ></nab-action-editor>'
})
class TestWrapperComponent {
    action;

    constructor() {
        this.action = new EditableAction('', ActionType.DATA, true);
    }
}
