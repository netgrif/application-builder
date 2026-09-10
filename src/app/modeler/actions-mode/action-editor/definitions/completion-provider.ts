import {ActionCompletionModel} from './action-completion-model';
import {declarationCompleteProvider, declarationReferenceCompleteProvider} from './declaration-provider';
import {fieldCompletionProposals} from './field-completion-provider';
import {functionCompletionProposals} from './function-provider';

export function actionCompletionProvider(
    model: any,
    position: any,
    languages: any,
    completionModel?: ActionCompletionModel,
): {suggestions: Array<any>} {
    const prefix = prefixAtPosition(model, position);
    const declarationCompletion = completeDeclaration(prefix, position, languages, completionModel);
    if (declarationCompletion) {
        return {suggestions: declarationCompletion};
    }
    const currentLine = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
    const access = currentLine.match(/([A-Za-z_$][\w$]*)((?:\.[A-Za-z_$][\w$]*)*)\.([A-Za-z_$][\w$]*)?$/);
    if (access) {
        const declaration = collectDeclarations(prefix).get(access[1]);
        if (declaration?.source === 'f') {
            const field = completionModel?.getDataSet().find(item => item.id === declaration.id);
            const partial = access[3] ?? '';
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - partial.length,
                endColumn: position.column,
            };
            const path = access[2] ? access[2].slice(1).split('.') : [];
            return {suggestions: fieldCompletionProposals(field?.type, path, range, languages)};
        }
    }
    const word = model.getWordUntilPosition(position);
    const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
    };
    return {
        suggestions: functionCompletionProposals(range, languages)
    };
}

function prefixAtPosition(model: any, position: any): string {
    const lines = new Array<string>();
    for (let lineNumber = 1; lineNumber <= position.lineNumber; lineNumber++) {
        const line = model.getLineContent(lineNumber);
        lines.push(lineNumber === position.lineNumber ? line.slice(0, position.column - 1) : line);
    }
    return lines.join('\n');
}

function completeDeclaration(
    prefix: string,
    position: any,
    languages: any,
    model?: ActionCompletionModel,
): Array<any> | undefined {
    if (prefix.includes(';')) {
        return undefined;
    }
    const segmentStart = Math.max(prefix.lastIndexOf('\n'), prefix.lastIndexOf(',')) + 1;
    const segment = prefix.slice(segmentStart);
    const colon = segment.indexOf(':');
    if (colon === -1 || !/^\s*[A-Za-z_$][\w$]*\s*$/.test(segment.slice(0, colon))) {
        return undefined;
    }
    const expression = segment.slice(colon + 1);
    const source = expression.match(/^\s*([ft])\.([\w$-]*)$/);
    if (source) {
        const partial = source[2];
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column - partial.length,
            endColumn: position.column,
        };
        return declarationReferenceCompleteProvider(source[1] as 'f' | 't', range, languages, model);
    }
    if (!/^\s*[ft]?$/.test(expression)) {
        return [];
    }
    const typed = expression.trim();
    const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - typed.length,
        endColumn: position.column,
    };
    return declarationCompleteProvider(range, languages);
}

function collectDeclarations(prefix: string): Map<string, {source: 'f' | 't'; id: string}> {
    const declarations = new Map<string, {source: 'f' | 't'; id: string}>();
    const end = prefix.indexOf(';');
    if (end === -1) {
        return declarations;
    }
    const declarationBlock = prefix.slice(0, end + 1);
    const pattern = /(?:^|[,\n])\s*([A-Za-z_$][\w$]*)\s*:\s*([ft])\.([\w$-]+)\s*(?=,|;)/g;
    let match: RegExpExecArray;
    while ((match = pattern.exec(declarationBlock)) !== null) {
        declarations.set(match[1], {source: match[2] as 'f' | 't', id: match[3]});
    }
    return declarations;
}
