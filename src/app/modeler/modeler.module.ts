import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModelerComponent} from './modeler.component';
import {MaterialImportModule} from '../material-import/material-import.module';
import {ControlPanelComponent} from './control-panel/control-panel.component';
import {DomSanitizer} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TriggerTreeComponent} from './control-panel/trees/trigger-tree/trigger-tree.component';
import {DialogManageRolesComponent} from '../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {CdkImportModule} from '../cdk-import/cdk-import.module';
import {SimulationModeComponent} from './simulation-mode/simulation-mode.component';
import {EditModeComponent} from './edit-mode/edit-mode.component';
import {RouterModule} from '@angular/router';
import {DataModeComponent} from './data-mode/data-mode.component';
import {RoleModeComponent} from './role-mode/role-mode.component';
import {ActionsModeComponent} from './actions-mode/actions-mode.component';
import {DialogArcAttachComponent} from '../dialogs/dialog-arc-attach/dialog-arc-attach.component';
import {environment} from '../../environments/environment';
import {I18nModeComponent} from './i18n-mode/i18n-mode.component';
import {DialogDeleteComponent} from '../dialogs/dialog-delete/dialog-delete.component';
import {DialogAddLanguageComponent} from '../dialogs/dialog-add-language/dialog-add-language.component';
import {MatIconRegistry} from '@angular/material/icon';
import {FormBuilderModule} from '../form-builder/form-builder.module';
import {ImportSuccessfulComponent} from './control-panel/import-successful/import-successful.component';
import {GridsterModule} from 'angular-gridster2';
import {ActionEditorModule} from './actions-mode/action-editor/action-editor.module';
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
import {PetriflowCanvasModule} from '@netgrif/petriflow.svg';
import {ModeComponent} from './control-panel/modes/mode-component/mode.component';
import {ToolComponent} from './control-panel/tools/tool-component/tool.component';
import {ImportToolButtonComponent} from './control-panel/modes/import-tool-button/import-tool-button.component';
import {ContextMenuComponent} from './edit-mode/context-menu/context-menu.component';
import {MaterialModule} from '@netgrif/components-core';
import {DataFieldsComponentModule, TaskContentComponentModule} from '@netgrif/components';
import {JoyrideModule} from 'ngx-joyride';
import {ResizableModule} from 'angular-resizable-element';
import {FlexLayoutModule} from '@ngbracket/ngx-layout';
import {DataMasterItemComponent} from './data-mode/data-master-item/data-master-item.component';
import {MasterDetailComponent} from './components/master-detail/master-detail.component';
import {DataDetailComponent} from './data-mode/data-detail/data-detail.component';
import {MainMasterComponent} from './components/master-detail/main-master/main-master.component';
import {MainMasterItemComponent} from './components/master-detail/main-master-item/main-master-item.component';
import {RoleDetailComponent} from './role-mode/role-detail/role-detail.component';
import {RoleMasterItemComponent} from './role-mode/role-master-item/role-master-item.component';

@NgModule({
    declarations: [
        DataMasterItemComponent,
        DataDetailComponent,
        ModelerComponent,
        ControlPanelComponent,
        DialogManageRolesComponent,
        TriggerTreeComponent,
        SimulationModeComponent,
        EditModeComponent,
        DataModeComponent,
        RoleModeComponent,
        ActionsModeComponent,
        DialogArcAttachComponent,
        I18nModeComponent,
        DialogDeleteComponent,
        DialogAddLanguageComponent,
        ImportSuccessfulComponent,
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
        EditModeComponent,
        ModeComponent,
        ToolComponent,
        ImportToolButtonComponent,
        ContextMenuComponent,
        MasterDetailComponent,
        MainMasterComponent,
        MainMasterItemComponent,
        RoleDetailComponent,
        RoleMasterItemComponent
    ],
    exports: [
        ActionEditorModule,
        TriggerTreeComponent
    ],
    imports: [
        ActionEditorModule,
        CdkImportModule,
        CommonModule,
        DataFieldsComponentModule,
        FlexLayoutModule,
        FormBuilderModule,
        FormsModule,
        GridsterModule,
        JoyrideModule,
        MaterialImportModule,
        MaterialModule,
        NgxDropzoneModule,
        PetriflowCanvasModule,
        ReactiveFormsModule,
        ResizableModule,
        RouterModule,
        TaskContentComponentModule,
    ]
})
export class ModelerModule {
    constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
        matIconRegistry.addSvgIcon('arc', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/arc.svg`));
        matIconRegistry.addSvgIcon('cursor-default-outline', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/cursor-default-outline.svg`));
        matIconRegistry.addSvgIcon('inhibitor', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/inhibitor.svg`));
        matIconRegistry.addSvgIcon('read', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/read.svg`));
        matIconRegistry.addSvgIcon('resetarc', domSanitizer.bypassSecurityTrustResourceUrl(`../../..${environment.deployUrl}assets/modeler/icons/resetarc.svg`));
    }
}
