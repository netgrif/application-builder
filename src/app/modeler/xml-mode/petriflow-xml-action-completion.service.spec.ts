import {PetriflowXmlActionCompletionService} from './petriflow-xml-action-completion.service';
import {ModelService} from '../services/model/model.service';

describe('PetriflowXmlActionCompletionService', () => {
    let originalMonaco: unknown;

    beforeEach(() => {
        originalMonaco = window['monaco'];
        window['monaco'] = {
            languages: {
                CompletionItemKind: {
                    Property: 1,
                    Variable: 2,
                    Function: 3,
                    Field: 4,
                },
                CompletionItemInsertTextRule: {
                    InsertAsSnippet: 5,
                },
            },
        };
    });

    afterEach(() => window['monaco'] = originalMonaco);

    it('offers the action editor helpers inside an action CDATA block', () => {
        const service = createService();
        const prefix = '<document>\n<action id="5"><![CDATA[\n\ncha';
        const suggestions = service['provideCompletionItems'](
            {getValueInRange: () => prefix},
            {lineNumber: 4, column: 4},
        ).suggestions;

        expect(suggestions.map(suggestion => suggestion.label)).toContain('change field value');
    });

    it('does not offer Groovy helpers outside an action CDATA block', () => {
        const service = createService();
        const suggestions = service['provideCompletionItems'](
            {getValueInRange: () => '<document><title>cha'},
            {lineNumber: 1, column: 21},
        ).suggestions;

        expect(suggestions).toEqual([]);
    });

    it('offers typed field members inside an action CDATA block', () => {
        const service = createService();
        const prefix = '<document>\n<action id="5"><![CDATA[\nstatus: f.status;\nstatus.';
        const suggestions = service['provideCompletionItems'](
            {getValueInRange: () => prefix},
            {lineNumber: 4, column: 8},
        ).suggestions;

        expect(suggestions.map(suggestion => suggestion.label)).toContain('maxLength');
        expect(suggestions.map(suggestion => suggestion.label)).toContain('value');
    });

    function createService(): PetriflowXmlActionCompletionService {
        return new PetriflowXmlActionCompletionService({
            model: {
                getDataSet: () => [{id: 'status', type: 'text', title: {value: 'Status'}}],
                getTransitions: () => [],
            },
        } as ModelService);
    }

});
