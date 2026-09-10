import {ActionCompletionModel} from './action-completion-model';

export function declarationCompleteProvider(range, languages) {
    return [
        {
            label: 'f.',
            kind: languages.CompletionItemKind.Field,
            documentation: 'ID of DataVariable for declare a varable in Action.',
            insertText: 'f.',
            range
        },
        {
            label: 't.',
            kind: languages.CompletionItemKind.Field,
            documentation: 'ID of Transition for declare a varable in Action.',
            insertText: 't.',
            range
        }
    ];
}

export function declarationReferenceCompleteProvider(
    source: 'f' | 't',
    range: any,
    languages: any,
    model?: ActionCompletionModel,
): Array<any> {
    if (!model) {
        return [];
    }
    if (source === 'f') {
        return model.getDataSet().map(field => ({
            label: field.id,
            kind: languages.CompletionItemKind.Field,
            detail: `${field.type} field`,
            documentation: field.title?.value || `Data field ${field.id}`,
            insertText: field.id,
            range,
        }));
    }
    return model.getTransitions().map(transition => ({
        label: transition.id,
        kind: languages.CompletionItemKind.Field,
        detail: 'Transition',
        documentation: transition.label?.value || `Transition ${transition.id}`,
        insertText: transition.id,
        range,
    }));
}
