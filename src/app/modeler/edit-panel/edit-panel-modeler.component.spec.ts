import {CommonModule} from '@angular/common';
import {Component, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSortModule} from '@angular/material/sort';
import {MatTabsModule} from '@angular/material/tabs';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {ResizableModule} from 'angular-resizable-element';
import {HotkeyModule} from 'angular2-hotkeys';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {CdkImportModule} from '../../cdk-import/cdk-import.module';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {ModelerModule} from '../modeler.module';

import {EditPanelModelerComponent} from './edit-panel-modeler.component';

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
        NoopAnimationsModule,
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
  template: '<mat-sidenav #sidenav><nab-edit-panel-modeler [nav]="sidenav"></nab-edit-panel-modeler></mat-sidenav>',
})
class TestWrapperComponent {
}
