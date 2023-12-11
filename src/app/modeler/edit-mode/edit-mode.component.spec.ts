import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSortModule} from '@angular/material/sort';
import {MatTabsModule} from '@angular/material/tabs';
import {RouterModule} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {ResizableModule} from 'angular-resizable-element';
import {HotkeyModule} from 'angular2-hotkeys';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {CdkImportModule} from '../../cdk-import/cdk-import.module';
import {MaterialImportModule} from '../../material-import/material-import.module';

import {EditModeComponent} from './edit-mode.component';

describe('EditModeComponent', () => {
  let component: EditModeComponent;
  let fixture: ComponentFixture<EditModeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EditModeComponent],
      imports: [
        HttpClientModule,
        MaterialImportModule,
        CommonModule,
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
        RouterTestingModule,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
