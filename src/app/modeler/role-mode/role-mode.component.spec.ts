import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {RoleModeComponent} from './role-mode.component';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {CommonModule} from '@angular/common';
import {CdkImportModule} from '../../cdk-import/cdk-import.module';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {HotkeyModule} from 'angular2-hotkeys';
import {ResizableModule} from 'angular-resizable-element';
import {HttpClientModule} from '@angular/common/http';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSortModule} from '@angular/material/sort';
import {FlexLayoutModule} from '@ngbracket/ngx-layout';
import {MonacoEditorModule} from 'ngx-monaco-editor-v2';

describe('RoleModeComponent', () => {
    let component: RoleModeComponent;
    let fixture: ComponentFixture<RoleModeComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [RoleModeComponent],
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
                ResizableModule
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(RoleModeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
