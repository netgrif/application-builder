import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {ActionsModeComponent} from './actions-mode.component';
import {HttpClientModule} from '@angular/common/http';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {CommonModule} from '@angular/common';
import {CdkImportModule} from '../../cdk-import/cdk-import.module';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {HotkeyModule} from 'angular2-hotkeys';
import {ResizableModule} from 'angular-resizable-element';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSortModule} from '@angular/material/sort';
import {ModelerModule} from '../modeler.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('ActionsModeComponent', () => {
    let component: ActionsModeComponent;
    let fixture: ComponentFixture<ActionsModeComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [],
            imports: [
                HttpClientModule,
                MaterialImportModule,
                CommonModule,
                CdkImportModule,
                // FlexLayoutModule,
                FormsModule,
                MatCheckboxModule,
                MatTabsModule,
                RouterModule,
                // MonacoEditorModule.forRoot(),
                HotkeyModule.forRoot(),
                MatSortModule,
                ResizableModule,
                ModelerModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ActionsModeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
