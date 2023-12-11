import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModelerComponent} from './modeler.component';
import {MaterialImportModule} from '../material-import/material-import.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ControlPanelComponent} from './control-panel/control-panel.component';
import {DomSanitizer} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EditPanelModelerComponent} from './edit-panel/edit-panel-modeler.component';
import {TriggerTreeComponent} from './control-panel/trees/trigger-tree/trigger-tree.component';
import {DialogManageRolesComponent} from '../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {CdkImportModule} from '../cdk-import/cdk-import.module';
import {HotkeyModule} from 'angular2-hotkeys';
import {SimulationModeComponent} from './simulation-mode/simulation-mode.component';
import {EditModeComponent} from './edit-mode/edit-mode.component';
import {RouterModule} from '@angular/router';
import {DataModeComponent} from './data-mode/data-mode.component';
import {RoleModeComponent} from './role-mode/role-mode.component';
import {ActionsModeComponent} from './actions-mode/actions-mode.component';
import {DialogArcAttachComponent} from '../dialogs/dialog-arc-attach/dialog-arc-attach.component';
import {environment} from '../../environments/environment';
import {I18nModeComponent} from './i18n-mode/i18n-mode.component';
import {ResizableModule} from 'angular-resizable-element';
import {DialogDeleteComponent} from '../dialogs/dialog-delete/dialog-delete.component';
import {
    DialogTransitionSettingsComponent
} from '../dialogs/dialog-transition-settings/dialog-transition-settings.component';
import {DialogAddLanguageComponent} from '../dialogs/dialog-add-language/dialog-add-language.component';
import {MatIconRegistry} from '@angular/material/icon';
import {JoyrideModule} from 'ngx-joyride';
import {FormBuilderModule} from '../form-builder/form-builder.module';
import {DataFieldsComponentModule, TaskContentComponentModule} from '@netgrif/components';
import {ImportSuccessfulComponent} from './control-panel/import-successful/import-successful.component';
import {GridsterModule} from 'angular-gridster2';
import {ActionEditorModule} from './actions-mode/action-editor/action-editor.module';
import {FastModeContextComponent} from './edit-mode/fast-mode-context/fast-mode-context.component';
import {LanguagesComponent} from './i18n-mode/languages/languages.component';
import {TranslationsComponent} from './i18n-mode/translations/translations.component';
import {ProgressComponent} from './i18n-mode/languages/progress/progress.component';
import {FlagComponent} from './i18n-mode/languages/flag/flag.component';
import {FlagFallbackDirective} from './i18n-mode/languages/flag/flag-fallback.directive';
import {TranslationGroupComponent} from './i18n-mode/translations/translation-group/translation-group.component';
import {
    ModelTranslationComponent
} from './i18n-mode/translations/translation-group/model-translation/model-translation.component';
import {I18nFieldComponent} from './i18n-mode/translations/i18n-field/i18n-field.component';
import {
    DataTranslationComponent
} from './i18n-mode/translations/translation-group/data-translation/data-translation.component';
import {
    RoleTranslationComponent
} from './i18n-mode/translations/translation-group/role-translation/role-translation.component';
import {
    TaskTranslationComponent
} from './i18n-mode/translations/translation-group/task-translation/task-translation.component';
import {NgxDropzoneModule} from 'ngx-dropzone';
import { BpmnModeEditorComponent } from './edit-mode/bpmn-mode/bpmn-mode-editor/bpmn-mode-editor.component';

@NgModule({
    declarations: [
        ModelerComponent,
        ControlPanelComponent,
        DialogManageRolesComponent,
        EditPanelModelerComponent,
        TriggerTreeComponent,
        SimulationModeComponent,
        EditModeComponent,
        DataModeComponent,
        RoleModeComponent,
        ActionsModeComponent,
        DialogArcAttachComponent,
        I18nModeComponent,
        DialogDeleteComponent,
        DialogTransitionSettingsComponent,
        DialogAddLanguageComponent,
        ImportSuccessfulComponent,
        FastModeContextComponent,
        LanguagesComponent,
        TranslationsComponent,
        ProgressComponent,
        FlagComponent,
        FlagFallbackDirective,
        TranslationGroupComponent,
        ModelTranslationComponent,
        I18nFieldComponent,
        DataTranslationComponent,
        RoleTranslationComponent,
        TaskTranslationComponent,
        BpmnModeEditorComponent
    ],
    exports: [
        ActionEditorModule
    ],
    imports: [
        CommonModule,
        MaterialImportModule,
        CdkImportModule,
        FlexLayoutModule,
        FormBuilderModule,
        FormsModule,
        RouterModule,
        HotkeyModule.forRoot(),
        ResizableModule,
        ReactiveFormsModule,
        JoyrideModule,
        TaskContentComponentModule,
        GridsterModule,
        DataFieldsComponentModule,
        ActionEditorModule,
        NgxDropzoneModule
    ]
})
export class ModelerModule {
    constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
        matIconRegistry.addSvgIcon('data', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/data.svg`));
        matIconRegistry.addSvgIcon('cursor-default-outline', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/cursor-default-outline.svg`));
        matIconRegistry.addSvgIcon('transition', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/transition.svg`));
        matIconRegistry.addSvgIcon('place', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/place.svg`));
        matIconRegistry.addSvgIcon('marking', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/marking.svg`));
        matIconRegistry.addSvgIcon('arc', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/arc.svg`));
        matIconRegistry.addSvgIcon('arcweight', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/arcweight.svg`));
        matIconRegistry.addSvgIcon('arcdataref', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/arcdataref.svg`));
        matIconRegistry.addSvgIcon('arcplaceref', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/arcplaceref.svg`));
        matIconRegistry.addSvgIcon('resetarc', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/resetarc.svg`));
        matIconRegistry.addSvgIcon('inhibitor', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/inhibitor.svg`));
        matIconRegistry.addSvgIcon('read', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/read.svg`));
        matIconRegistry.addSvgIcon('properties', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/properties.svg`));
    }
}
