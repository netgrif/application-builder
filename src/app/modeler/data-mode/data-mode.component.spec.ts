import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {DataModeComponent} from './data-mode.component';
import {HttpClientModule} from '@angular/common/http';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {CommonModule} from '@angular/common';
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
import {ModelerModule} from '../modeler.module';
import {Model} from '@netgrif/petriflow';
import {BehaviorSubject} from 'rxjs';
import {ModelService} from '../services/model.service';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('DataModeComponent', () => {
    let component: DataModeComponent;
    let fixture: ComponentFixture<DataModeComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [],
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
                ModelerModule,
                NoopAnimationsModule
            ],
            providers: [{provide: ModelService, useClass: MockModelService}]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataModeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

class MockModelService {
    model = new Model();
}
