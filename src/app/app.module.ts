import {BrowserModule, DomSanitizer} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MaterialImportModule} from './material-import/material-import.module';
import {FormBuilderModule} from './form-builder/form-builder.module';
import {RouterModule, Routes} from '@angular/router';
import {FormBuilderComponent} from './form-builder/form-builder.component';
import {ModelerComponent} from './modeler/modeler.component';
import {ModelerModule} from './modeler/modeler.module';
import {EditModeComponent} from './modeler/edit-mode/edit-mode.component';
import {SimulationModeComponent} from './modeler/simulation-mode/simulation-mode.component';
import {DataModeComponent} from './modeler/data-mode/data-mode.component';
import {RoleModeComponent} from './modeler/role-mode/role-mode.component';
import {ActionsModeComponent} from './modeler/actions-mode/actions-mode.component';
import {MatIconRegistry} from '@angular/material/icon';
import {AuthenticationModule, ConfigurationService, TranslateLibModule} from '@netgrif/components-core';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {environment} from '../environments/environment';
import {DialogConfirmComponent} from './dialogs/dialog-confirm/dialog-confirm.component';
import {JoyrideModule} from 'ngx-joyride';
import {DialogRefactorComponent} from './dialogs/dialog-refactor/dialog-refactor.component';
import {DialogErrorsComponent} from './dialogs/dialog-errors/dialog-errors.component';
import {TaskContentComponentModule} from '@netgrif/components';
import {ExportService, ImportService} from '@netgrif/petriflow';
import {SelectedTransitionService} from './modeler/selected-transition.service';
import {I18nModeComponent} from './modeler/i18n-mode/i18n-mode.component';
import {DialogDeadNetComponent} from './dialogs/dialog-dead-net/dialog-dead-net.component';
import {AppRoutingModule} from './app-routing.module';
import {DialogPlaceRefDeleteComponent} from './dialogs/dialog-place-ref-delete/dialog-place-ref-delete.component';

const appRoutes: Routes = [
  {
    path: 'modeler', component: ModelerComponent, children: [
      {path: '', component: EditModeComponent},
      {path: 'simulation', component: SimulationModeComponent},
      {path: 'data', component: DataModeComponent},
      {path: 'roles', component: RoleModeComponent},
      {path: 'actions', component: ActionsModeComponent},
      {path: 'i18n', component: I18nModeComponent},
    ],
  },
  {path: 'form', component: FormBuilderComponent},
  {path: '**', redirectTo: 'modeler'},
];

@NgModule({
  declarations: [
    AppComponent,
    DialogConfirmComponent,
    DialogRefactorComponent,
    DialogErrorsComponent,
    DialogDeadNetComponent,
    DialogPlaceRefDeleteComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialImportModule,
    FlexLayoutModule,
    FormBuilderModule,
    ModelerModule,
    TranslateLibModule,
    AuthenticationModule,
    RouterModule.forRoot(appRoutes, {relativeLinkResolution: 'legacy'}),
    JoyrideModule.forRoot(),
    TaskContentComponentModule,
    AppRoutingModule,
  ],
  providers: [
    ImportService,
    ExportService,
    {provide: ConfigurationService, useClass: AppBuilderConfigurationService},
    // {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: MaterialAppearance.OUTLINE}}
  ],
  bootstrap: [AppComponent],
})
export class AppModule {

  constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer, private transitionService: SelectedTransitionService) {
    this.transitionService.id = undefined;
    matIconRegistry.addSvgIcon('twitch', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/twitch.svg`));
    matIconRegistry.addSvgIcon('youtube', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/youtube.svg`));
    matIconRegistry.addSvgIcon('github', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/github.svg`));
  }
}
