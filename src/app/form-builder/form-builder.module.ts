import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilderComponent} from './form-builder.component';
import {PaperComponent} from './paper/paper.component';
import {FieldListComponent} from './field-list/field-list.component';
import {GridsterComponent} from './gridster/gridster.component';
import {EditPanelComponent} from './edit-panel/edit-panel.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {GridsterModule} from 'angular-gridster2';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {MaterialImportModule} from '../material-import/material-import.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {AngularResizeEventModule} from 'angular-resize-event';
import {GridsterDataFieldComponent} from './gridster/gridster-datafield/gridster-data-field.component';
import {ResizableModule} from 'angular-resizable-element';
import {InfoLabelComponent} from './info-label/info-label.component';
import {DataFieldsComponentModule} from '@netgrif/components';

@NgModule({
  declarations: [
    FormBuilderComponent,
    PaperComponent,
    FieldListComponent,
    GridsterComponent,
    EditPanelComponent,
    GridsterDataFieldComponent,
    InfoLabelComponent,
  ],
  exports: [
    FormBuilderComponent,
  ],
  imports: [
    CommonModule,
    DragDropModule,
    GridsterModule,
    FormsModule,
    HttpClientModule,
    MaterialImportModule,
    FlexLayoutModule,
    AngularResizeEventModule,
    ResizableModule,
    ReactiveFormsModule,
    DataFieldsComponentModule,
  ],
})
export class FormBuilderModule {
}
