import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionEditorListComponent} from './action-editor-list/action-editor-list.component';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {tokenProvider} from './definitions/tokens';
import {actionCompletionProvider} from './definitions/completion-provider';
import {ActionEditorMenuComponent} from './action-editor-menu/action-editor-menu.component';
import {
    ActionEditorMenuDescriptionComponent
} from './action-editor-menu/action-editor-menu-description/action-editor-menu-description.component';
import {MaterialImportModule} from '../../../material-import/material-import.module';
import {ActionEditorComponent} from './action-editor/action-editor.component';
import {
    ActionEditorMenuItemComponent
} from './action-editor-menu/action-editor-menu-item/action-editor-menu-item.component';
import {SafeHtmlPipe} from './action-editor-menu/action-editor-menu-item/safe-html.pipe';
import {FunctionEditorComponent} from './function-editor/function-editor.component';
import {MonacoEditorModule, NgxMonacoEditorConfig} from 'ngx-monaco-editor-v2';
import {FlexModule} from '@ngbracket/ngx-layout';

declare var monaco: any;

export function onMonacoLoad() {
    monaco.languages.register({id: 'petriflow'});
    monaco.languages.setMonarchTokensProvider('petriflow', tokenProvider() as any);
    monaco.languages.registerCompletionItemProvider('petriflow', {
        provideCompletionItems(model, position) {
            return actionCompletionProvider(model, position, monaco.languages);
        }
    } as any);
    monaco.editor.defineTheme('petriflowTheme', {
        base: 'vs-dark', // can also be vs-dark or hc-black
        inherit: false, // can also be false to completely replace the builtin rules
        rules: [
            {token: 'errorSyntax', foreground: 'ff0000', fontStyle: 'bold'}
        ]
    } as any);
}

const monacoConfig: NgxMonacoEditorConfig = {
    defaultOptions: {
        scrollBeyondLastLine: false,
    }, // pass default options to be used
    onMonacoLoad // here monaco object will be available as window.monaco use this function to extend monaco editor functionalities.
};

@NgModule({
    declarations: [
        ActionEditorComponent,
        ActionEditorListComponent,
        ActionEditorMenuComponent,
        ActionEditorMenuDescriptionComponent,
        ActionEditorMenuItemComponent,
        SafeHtmlPipe,
        FunctionEditorComponent
    ],
    exports: [
        ActionEditorListComponent,
        FunctionEditorComponent
    ],
    imports: [
        CommonModule,
        BrowserModule,
        FormsModule,
        FlexModule,
        MaterialImportModule,
        MonacoEditorModule.forRoot(monacoConfig),
    ]
})
export class ActionEditorModule {
}
