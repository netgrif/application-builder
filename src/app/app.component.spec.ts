import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MatListModule} from '@angular/material/list';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {AuthenticationModule, ConfigurationService} from '@netgrif/components-core';
import {JoyrideModule} from 'ngx-joyride';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {AppComponent} from './app.component';
import {AppModule} from './app.module';
import {FormBuilderModule} from './form-builder/form-builder.module';
import {MaterialImportModule} from './material-import/material-import.module';

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
