import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ActionEditorListComponent} from './action-editor-list.component';
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
import {ModelerModule} from '../../../modeler.module';
import {Component} from '@angular/core';
import {LeafNode} from '../classes/leaf-node';
import {ActionEditorService} from '../action-editor.service';
import {ActionType} from '../classes/editable-action';

describe('ActionEditorListComponent', () => {
    let component: ActionEditorListComponent;
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
                ModelerModule
            ]
        })
            .compileComponents();
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
    template: '<nab-action-editor-list [leafNode]="leafNode"></nab-action-editor-list>'
})
class TestWrapperComponent {
    leafNode;

    constructor(private actionEditorService: ActionEditorService) {
        this.leafNode = new LeafNode(ActionType.TRANSITION, actionEditorService);
    }
}
