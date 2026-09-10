import {ActionCompletionModel} from './action-completion-model';
import {actionCompletionProvider} from './completion-provider';

describe('actionCompletionProvider', () => {
    const languages = {
        CompletionItemKind: {
            Property: 1,
            Variable: 2,
            Function: 3,
            Field: 4,
        },
        CompletionItemInsertTextRule: {
            InsertAsSnippet: 5,
        },
    };
    const completionModel: ActionCompletionModel = {
        getDataSet: () => [
            {id: 'status', type: 'text', title: {value: 'Status'}},
            {id: 'amount', type: 'number', title: {value: 'Amount'}},
            {id: 'attachment', type: 'file', title: {value: 'Attachment'}},
            {id: 'decision', type: 'boolean', title: {value: 'Decision'}},
            {id: 'choice', type: 'enumeration', title: {value: 'Choice'}},
            {id: 'option', type: 'enumeration_map', title: {value: 'Option'}},
            {id: 'deadline', type: 'dateTime', title: {value: 'Deadline'}},
            {id: 'related_cases', type: 'caseRef', title: {value: 'Related cases'}},
            {id: 'actors', type: 'actorList', title: {value: 'Actors'}},
            {id: 'attachments', type: 'fileList', title: {value: 'Attachments'}},
        ],
        getTransitions: () => [
            {id: 'approve', label: {value: 'Approve'}},
        ],
    };

    it('suggests fields and transitions in dependency declarations', () => {
        expect(labels(complete('status: f.'))).toContain('status');
        expect(labels(complete('status: f.'))).toContain('attachments');
        expect(labels(complete('task: t.'))).toEqual(['approve']);
    });

    it('offers common and text-specific members for a declared text field', () => {
        const suggestions = complete('status: f.status;\nstatus.');

        expect(labels(suggestions)).toContain('value');
        expect(labels(suggestions)).toContain('clearValue');
        expect(labels(suggestions)).toContain('maxLength');
        expect(labels(suggestions)).not.toContain('minValue');
        expect(suggestions.find(item => item.label === 'value').detail).toBe('value: String');
    });

    it('resolves every declaration in a multiline dependency block', () => {
        const suggestions = complete('status: f.status,\namount: f.amount;\namount.mi');

        expect(labels(suggestions)).toContain('minValue');
        expect(labels(suggestions)).toContain('maxValue');
        expect(suggestions[0].range.startColumn).toBe(8);
    });

    it('offers members of complex field values', () => {
        const suggestions = complete('attachment: f.attachment;\nattachment.value.');

        expect(labels(suggestions)).toContain('name');
        expect(labels(suggestions)).toContain('path');
        expect(labels(suggestions)).toContain('previewPath');
    });

    it('maps Engine subclass members for the supported field families', () => {
        const expectedMembers = [
            ['decision', 'and'],
            ['choice', 'choices'],
            ['option', 'options'],
            ['deadline', 'minDate'],
            ['related_cases', 'allowedNets'],
            ['actors', 'roles'],
            ['attachments', 'addValue'],
        ];

        expectedMembers.forEach(([fieldId, member]) => {
            expect(labels(complete(`${fieldId}: f.${fieldId};\n${fieldId}.`))).toContain(member);
        });
    });

    it('keeps the existing action helpers outside field member access', () => {
        expect(labels(complete('status: f.status;\ncha'))).toContain('change field value');
    });

    function complete(value: string): Array<any> {
        const lines = value.split('\n');
        const position = {
            lineNumber: lines.length,
            column: lines[lines.length - 1].length + 1,
        };
        const model = {
            getLineContent: (lineNumber: number) => lines[lineNumber - 1] ?? '',
            getWordUntilPosition: currentPosition => {
                const line = lines[currentPosition.lineNumber - 1] ?? '';
                const beforeCursor = line.slice(0, currentPosition.column - 1);
                const word = beforeCursor.match(/[A-Za-z_$][\w$]*$/)?.[0] ?? '';
                return {
                    startColumn: currentPosition.column - word.length,
                    endColumn: currentPosition.column,
                };
            },
        };
        return actionCompletionProvider(model, position, languages, completionModel).suggestions;
    }

    function labels(suggestions: Array<any>): Array<string> {
        return suggestions.map(suggestion => suggestion.label);
    }
});
