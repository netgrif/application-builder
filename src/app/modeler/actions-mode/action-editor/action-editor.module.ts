import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FlexModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {ResizableModule} from 'angular-resizable-element';
import {editor, languages} from 'monaco-editor';
import {MonacoEditorModule, NgxMonacoEditorConfig} from 'ngx-monaco-editor';
import {MaterialImportModule} from '../../../material-import/material-import.module';
import {ActionEditorListComponent} from './action-editor-list/action-editor-list.component';
import {
  ActionEditorMenuDescriptionComponent,
} from './action-editor-menu/action-editor-menu-description/action-editor-menu-description.component';
import {
  ActionEditorMenuItemComponent,
} from './action-editor-menu/action-editor-menu-item/action-editor-menu-item.component';
import {SafeHtmlPipe} from './action-editor-menu/action-editor-menu-item/safe-html.pipe';
import {ActionEditorMenuComponent} from './action-editor-menu/action-editor-menu.component';
import {ActionEditorComponent} from './action-editor/action-editor.component';
import {actionCompletionProvider} from './definitions/completion-provider';
import {tokenProvider} from './definitions/tokens';
import {FunctionEditorComponent} from './function-editor/function-editor.component';

export function onMonacoLoad() {
  languages.register({id: 'petriflow'});
  languages.setMonarchTokensProvider('petriflow', tokenProvider() as any);
  languages.registerCompletionItemProvider('petriflow', {
    provideCompletionItems(model, position) {
      return actionCompletionProvider(model, position);
    },
  } as any);
  editor.defineTheme('petriflowTheme', {
    base: 'vs', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      {token: 'errorSyntax', foreground: 'ff0000', fontStyle: 'bold'},
    ],
  } as any);
}

const monacoConfig: NgxMonacoEditorConfig = {
  defaultOptions: {scrollBeyondLastLine: false}, // pass default options to be used
  onMonacoLoad, // here monaco object will be available as window.monaco use this function to extend monaco editor functionalities.
};

@NgModule({
  declarations: [
    ActionEditorComponent,
    ActionEditorListComponent,
    ActionEditorMenuComponent,
    ActionEditorMenuDescriptionComponent,
    ActionEditorMenuItemComponent,
    SafeHtmlPipe,
    FunctionEditorComponent,
  ],
  exports: [
    ActionEditorListComponent,
    FunctionEditorComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MaterialImportModule,
    FlexModule,
    MonacoEditorModule.forRoot(monacoConfig),
    ResizableModule,
  ],
})
export class ActionEditorModule {
}
