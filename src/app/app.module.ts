import {CommonModule, NgOptimizedImage} from '@angular/common';
import {NgModule} from '@angular/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MatIconRegistry} from '@angular/material/icon';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {BrowserModule, DomSanitizer} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule, Routes} from '@angular/router';
import {TaskContentComponentModule} from '@netgrif/components';
import {AuthenticationMethodService, ConfigurationService, NullAuthenticationService} from '@netgrif/components-core';
import {ExportService, ImportService} from '@netgrif/petriflow';
import {JoyrideModule} from 'ngx-joyride';
import {environment} from '../environments/environment';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {DialogArcEditComponent} from './dialogs/dialog-arc-edit/dialog-arc-edit.component';
import {DialogChangeDataComponent} from './dialogs/dialog-change-data/dialog-change-data.component';
import {DialogConfirmComponent} from './dialogs/dialog-confirm/dialog-confirm.component';
import {DialogDeadNetComponent} from './dialogs/dialog-dead-net/dialog-dead-net.component';
import {DialogDeleteModelComponent} from './dialogs/dialog-delete-model/dialog-delete-model.component';
import {DialogErrorsComponent} from './dialogs/dialog-errors/dialog-errors.component';
import {
  DialogLocalStorageModelComponent,
} from './dialogs/dialog-local-storage-model/dialog-local-storage-model.component';
import {DialogMarkingChangeComponent} from './dialogs/dialog-marking-change/dialog-marking-change.component';
import {DialogModelEditComponent} from './dialogs/dialog-model-edit/dialog-model-edit.component';
import {DialogPlaceEditComponent} from './dialogs/dialog-place-edit/dialog-place-edit.component';
import {DialogPlaceRefDeleteComponent} from './dialogs/dialog-place-ref-delete/dialog-place-ref-delete.component';
import {DialogRefactorComponent} from './dialogs/dialog-refactor/dialog-refactor.component';
import {DialogTransitionEditComponent} from './dialogs/dialog-transition-edit/dialog-transition-edit.component';
import {FormBuilderComponent} from './form-builder/form-builder.component';
import {FormBuilderModule} from './form-builder/form-builder.module';
import {MaterialImportModule} from './material-import/material-import.module';
import {ActionsModeComponent} from './modeler/actions-mode/actions-mode.component';
import {BuilderPaginatorIntl} from './modeler/components/master-detail/main-master/builder-paginator-inpl';
import {MaterialIconPickerComponent} from './modeler/components/material-icon-picker/material-icon-picker.component';
import {DataModeComponent} from './modeler/data-mode/data-mode.component';
import {EditModeComponent} from './modeler/edit-mode/edit-mode.component';
import {HistoryModeComponent} from './modeler/history-mode/history-mode.component';
import {I18nModeComponent} from './modeler/i18n-mode/i18n-mode.component';
import {ModelerComponent} from './modeler/modeler.component';
import {ModelerModule} from './modeler/modeler.module';
import {RoleModeComponent} from './modeler/role-mode/role-mode.component';
import {SelectedTransitionService} from './modeler/selected-transition.service';
import {SimulationModeComponent} from './modeler/simulation-mode/simulation-mode.component';

const appRoutes: Routes = [
    {
        path: 'modeler', component: ModelerComponent, children: [
            {path: '', component: EditModeComponent},
            {path: SimulationModeComponent.URL, component: SimulationModeComponent},
            {path: 'data', component: DataModeComponent},
            {path: 'roles', component: RoleModeComponent},
            {path: 'actions', component: ActionsModeComponent},
            {path: 'i18n', component: I18nModeComponent},
            {path: 'history', component: HistoryModeComponent},
        ]
    },
    {path: 'form', component: FormBuilderComponent},
    {path: '**', redirectTo: 'modeler'}
];

@NgModule({
    declarations: [
        AppComponent,
        DialogConfirmComponent,
        DialogRefactorComponent,
        DialogErrorsComponent,
        DialogDeadNetComponent,
        DialogPlaceRefDeleteComponent,
        DialogPlaceEditComponent,
        DialogDeleteModelComponent,
        DialogArcEditComponent,
        DialogTransitionEditComponent,
        DialogChangeDataComponent,
        DialogModelEditComponent,
        MaterialIconPickerComponent,
        DialogLocalStorageModelComponent,
        DialogMarkingChangeComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MaterialImportModule,
        FormBuilderModule,
        JoyrideModule.forRoot(),
        ModelerModule,
        RouterModule.forRoot(appRoutes),
        AppRoutingModule,
        NgOptimizedImage,
        TaskContentComponentModule,
        CommonModule,
        MatProgressSpinnerModule
    ],
    providers: [
        ImportService,
        ExportService,
        {provide: MatPaginatorIntl, useClass: BuilderPaginatorIntl},
        {provide: AuthenticationMethodService, useValue: NullAuthenticationService},
        {provide: ConfigurationService, useClass: AppBuilderConfigurationService},
        {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
    ],
    exports: [],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer, private transitionService: SelectedTransitionService) {
        this.transitionService.id = undefined;
        matIconRegistry.addSvgIcon('twitch', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/twitch.svg`));
        matIconRegistry.addSvgIcon('youtube', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/youtube.svg`));
        matIconRegistry.addSvgIcon('github', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/github.svg`));
    }
}
