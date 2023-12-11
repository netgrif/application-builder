import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {ModelerComponent} from './modeler.component';
import {CommonModule} from '@angular/common';
import {MaterialImportModule} from '../material-import/material-import.module';
import {CdkImportModule} from '../cdk-import/cdk-import.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {HotkeyModule} from 'angular2-hotkeys';
import {ResizableModule} from 'angular-resizable-element';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSortModule} from '@angular/material/sort';
import {ModelerModule} from './modeler.module';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {JoyrideModule} from 'ngx-joyride';

describe('ModelerComponent', () => {
  let component: ModelerComponent;
  let fixture: ComponentFixture<ModelerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
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
        RouterTestingModule.withRoutes([]),
        JoyrideModule.forRoot(),
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
