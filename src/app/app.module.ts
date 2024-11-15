import {BrowserModule, DomSanitizer} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialImportModule} from './material-import/material-import.module';
import {FormBuilderModule} from './form-builder/form-builder.module';
import {RouterModule, Routes} from '@angular/router';
import {FormBuilderComponent} from './form-builder/form-builder.component';
import {ModelerComponent} from './modeler/modeler.component';
import {ModelerModule} from './modeler/modeler.module';
import {EditModeComponent} from './modeler/edit-mode/edit-mode.component';
import {DataModeComponent} from './modeler/data-mode/data-mode.component';
import {RoleModeComponent} from './modeler/role-mode/role-mode.component';
import {ActionsModeComponent} from './modeler/actions-mode/actions-mode.component';
import {MatIconRegistry} from '@angular/material/icon';
import {environment} from '../environments/environment';
import {DialogConfirmComponent} from './dialogs/dialog-confirm/dialog-confirm.component';
import {DialogRefactorComponent} from './dialogs/dialog-refactor/dialog-refactor.component';
import {DialogErrorsComponent} from './dialogs/dialog-errors/dialog-errors.component';
import {ExportService, ImportService} from '@netgrif/petriflow';
import {SelectedTransitionService} from './modeler/selected-transition.service';
import {I18nModeComponent} from './modeler/i18n-mode/i18n-mode.component';
import {DialogDeadNetComponent} from './dialogs/dialog-dead-net/dialog-dead-net.component';
import {AppRoutingModule} from './app-routing.module';
import {DialogPlaceRefDeleteComponent} from './dialogs/dialog-place-ref-delete/dialog-place-ref-delete.component';
import {DialogPlaceEditComponent} from './dialogs/dialog-place-edit/dialog-place-edit.component';
import {DialogDeleteModelComponent} from './dialogs/dialog-delete-model/dialog-delete-model.component';
import {DialogArcEditComponent} from './dialogs/dialog-arc-edit/dialog-arc-edit.component';
import {DialogTransitionEditComponent} from './dialogs/dialog-transition-edit/dialog-transition-edit.component';
import {SimulationModeComponent} from './modeler/simulation-mode/simulation-mode.component';
import {
    DialogLocalStorageModelComponent
} from './dialogs/dialog-local-storage-model/dialog-local-storage-model.component';
import {HistoryModeComponent} from './modeler/history-mode/history-mode.component';
import {DialogChangeDataComponent} from './dialogs/dialog-change-data/dialog-change-data.component';
import {DialogModelEditComponent} from './dialogs/dialog-model-edit/dialog-model-edit.component';
import {MaterialIconPickerComponent} from './modeler/components/material-icon-picker/material-icon-picker.component';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {TaskContentComponentModule} from '@netgrif/components';
import {JoyrideModule} from 'ngx-joyride';
import {AuthenticationMethodService, ConfigurationService, NullAuthenticationService} from '@netgrif/components-core';
import {AppBuilderConfigurationService} from './app-builder-configuration.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {BuilderPaginatorIntl} from './modeler/components/master-detail/main-master/builder-paginator-inpl';

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
