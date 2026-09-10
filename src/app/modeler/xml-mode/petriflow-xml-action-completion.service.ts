import {Injectable} from '@angular/core';
import {actionCompletionProvider} from '../actions-mode/action-editor/definitions/completion-provider';
import {ModelService} from '../services/model/model.service';
import {PETRIFLOW_XML_LANGUAGE_ID} from './petriflow-xml-language';

declare const monaco: any;

@Injectable({providedIn: 'root'})
export class PetriflowXmlActionCompletionService {
    constructor(private modelService: ModelService) {
    }

    register(): {dispose(): void} {
        return monaco.languages.registerCompletionItemProvider(PETRIFLOW_XML_LANGUAGE_ID, {
            triggerCharacters: ['.', ':', ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'],
            provideCompletionItems: (model, position) => this.provideCompletionItems(model, position),
        });
    }

    private provideCompletionItems(model: any, position: any): {suggestions: Array<any>} {
        const prefix = this.documentPrefix(model, position);
        const actionStart = prefix.lastIndexOf('<action');
        const cdataStart = prefix.lastIndexOf('<![CDATA[');
        if (actionStart === -1 || cdataStart < actionStart || prefix.lastIndexOf(']]>') > cdataStart) {
            return {suggestions: []};
        }
        const codeStart = cdataStart + '<![CDATA['.length;
        const code = prefix.slice(codeStart);
        const lines = code.split('\n');
        const localPosition = {
            lineNumber: lines.length,
            column: lines[lines.length - 1].length + 1,
        };
        const virtualModel = {
            getLineContent: (lineNumber: number) => lines[lineNumber - 1] ?? '',
            getWordUntilPosition: local => this.wordUntilPosition(lines[local.lineNumber - 1] ?? '', local),
        };
        const completion = actionCompletionProvider(
            virtualModel,
            localPosition,
            monaco.languages,
            this.modelService.model,
        );
        const codeStartPosition = this.positionAt(prefix, codeStart);
        return {
            suggestions: completion.suggestions.map(suggestion => ({
                ...suggestion,
                range: this.toDocumentRange(suggestion.range, codeStartPosition),
            })),
        };
    }

    private documentPrefix(model: any, position: any): string {
        return model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        });
    }

    private wordUntilPosition(line: string, position: any): {startColumn: number; endColumn: number} {
        const beforeCursor = line.slice(0, position.column - 1);
        const word = beforeCursor.match(/[A-Za-z_$][\w$]*$/)?.[0] ?? '';
        return {
            startColumn: position.column - word.length,
            endColumn: position.column,
        };
    }

    private positionAt(text: string, offset: number): {lineNumber: number; column: number} {
        const lines = text.slice(0, offset).split('\n');
        return {
            lineNumber: lines.length,
            column: lines[lines.length - 1].length + 1,
        };
    }

    private toDocumentRange(range: any, start: {lineNumber: number; column: number}): any {
        const lineOffset = start.lineNumber - 1;
        return {
            startLineNumber: range.startLineNumber + lineOffset,
            endLineNumber: range.endLineNumber + lineOffset,
            startColumn: range.startLineNumber === 1
                ? range.startColumn + start.column - 1
                : range.startColumn,
            endColumn: range.endLineNumber === 1
                ? range.endColumn + start.column - 1
                : range.endColumn,
        };
    }
}
