import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {TriggerTreeComponent} from './trigger-tree.component';
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
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('TriggerTreeComponent', () => {
    let component: TriggerTreeComponent;
    let fixture: ComponentFixture<TestWrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [TriggerTreeComponent, TestWrapperComponent],
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
                NoopAnimationsModule
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
    template: '<mat-sidenav #sidenav><nab-trigger-tree [nav]="sidenav" [triggers]="[]"></nab-trigger-tree></mat-sidenav>'
})
class TestWrapperComponent {
}
