import {waitForAsync, TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialImportModule} from './material-import/material-import.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormBuilderModule} from './form-builder/form-builder.module';
import {RouterTestingModule} from '@angular/router/testing';
import {MatListModule} from '@angular/material/list';
import {JoyrideModule} from 'ngx-joyride';
import {AuthenticationModule, ConfigurationService} from '@netgrif/components-core';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AppModule} from './app.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MaterialImportModule,
        FlexLayoutModule,
        FormBuilderModule,
        AppModule,
        MatListModule,
        AuthenticationModule,
        RouterTestingModule,
        HttpClientTestingModule,
        JoyrideModule.forRoot(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{provide: ConfigurationService, useClass: AppBuilderConfigurationService}],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
