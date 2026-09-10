export const PETRIFLOW_XML_LANGUAGE_ID = 'petriflow-xml';

export function registerPetriflowXmlLanguage(monacoApi: any): void {
    if (monacoApi.languages.getLanguages().some(language => language.id === PETRIFLOW_XML_LANGUAGE_ID)) {
        return;
    }
    monacoApi.languages.register({id: PETRIFLOW_XML_LANGUAGE_ID});
    monacoApi.languages.setLanguageConfiguration(PETRIFLOW_XML_LANGUAGE_ID, {
        autoClosingPairs: [
            {open: '"', close: '"'},
            {open: '\'', close: '\''},
            {open: '<', close: '>'},
        ],
        surroundingPairs: [
            {open: '"', close: '"'},
            {open: '\'', close: '\''},
            {open: '<', close: '>'},
        ],
    });
    monacoApi.languages.setMonarchTokensProvider(PETRIFLOW_XML_LANGUAGE_ID, {
        tokenizer: {
            root: [
                [/<\?/, {token: 'metatag', next: '@processing'}],
                [/<!--/, {token: 'comment', next: '@comment'}],
                [/<action\b/, {token: 'tag', next: '@actionTag'}],
                [/<!\[CDATA\[/, {token: 'delimiter.cdata', next: '@cdata'}],
                [/<\/?[\w:.-]+/, {token: 'tag', next: '@tag'}],
                [/[^<]+/, ''],
                [/</, 'delimiter'],
            ],
            tag: [
                [/\s+/, 'white'],
                [/[\w:.-]+/, 'attribute.name'],
                [/=/, 'delimiter'],
                [/"[^"]*"|'[^']*'/, 'attribute.value'],
                [/\/?>/, {token: 'delimiter', next: '@pop'}],
            ],
            actionTag: [
                [/\s+/, 'white'],
                [/[\w:.-]+/, 'attribute.name'],
                [/=/, 'delimiter'],
                [/"[^"]*"|'[^']*'/, 'attribute.value'],
                [/\/>/, {token: 'delimiter', next: '@root'}],
                [/>/, {token: 'delimiter', next: '@actionBody'}],
            ],
            actionBody: [
                [/\s+/, 'white'],
                [/<!\[CDATA\[/, {token: 'delimiter.cdata', next: '@actionCdata', nextEmbedded: 'petriflow'}],
                [/<\/action\s*>/, {token: 'tag', next: '@root'}],
                [/<\/?[\w:.-]+/, {token: 'tag', next: '@tag'}],
                [/[^<]+/, ''],
            ],
            actionCdata: [
                [/]]>/, {token: 'delimiter.cdata', next: '@actionBody', nextEmbedded: '@pop'}],
                [/[^\]]+/, ''],
                [/./, ''],
            ],
            cdata: [
                [/]]>/, {token: 'delimiter.cdata', next: '@pop'}],
                [/[^\]]+/, 'string'],
                [/./, 'string'],
            ],
            comment: [
                [/-->/, {token: 'comment', next: '@pop'}],
                [/[^-]+/, 'comment'],
                [/./, 'comment'],
            ],
            processing: [
                [/\?>/, {token: 'metatag', next: '@pop'}],
                [/./, 'metatag.content'],
            ],
        },
    });
}
