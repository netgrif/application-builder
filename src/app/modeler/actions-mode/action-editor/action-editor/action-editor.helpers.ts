import { MenuItemConfiguration } from '../action-editor-menu/action-editor-menu-item/menu-item-configuration';
import { MenuItem } from '../action-editor-menu/action-editor-menu-item/menu-item';
import { ModelService } from '../../../services/model/model.service';
import { EditableAction } from '../classes/editable-action';

export interface BuiltEditorConfigs {
    transition: MenuItemConfiguration;
    dataField: MenuItemConfiguration;
    behaviour: MenuItemConfiguration;
    condition: MenuItemConfiguration;
    property: MenuItemConfiguration;
    value: MenuItemConfiguration;
    type: MenuItemConfiguration;
    dataSet: MenuItemConfiguration;
    processInstanceId: MenuItemConfiguration;
    casePredicate: MenuItemConfiguration;
    taskPredicate: MenuItemConfiguration;
    all: MenuItemConfiguration[];
    keywordConfigPairs: Array<{ keyword: string; config: MenuItemConfiguration }>;
    defaultExpandedTypes: Set<string>;
}

export function buildEditorConfigurations(
    actionEditor: any,
    modelService: ModelService
): BuiltEditorConfigs {
    const editor = null;

    const transition = new MenuItemConfiguration(
        'Transitions',
        'transition',
        ['<transition>', '<transitionId>', '<task>'],
        editor,
        actionEditor,
        modelService.model.getTransitions().map(
            (t: any) => new MenuItem(t.id, `${t.label?.value} [${t.id}]`)
        )
    );

    const dataField = new MenuItemConfiguration(
        'Data fields',
        'datafield',
        ['<datafield>', '<datafieldId>'],
        editor,
        actionEditor,
        modelService.model.getDataSet().map(
            (f: any) => new MenuItem(f.id, `${f.title?.value} [${f.id}]`)
        )
    );

    const behaviour = new MenuItemConfiguration(
        'Behaviours',
        'behaviour',
        ['<behaviour>'],
        editor,
        actionEditor,
        [
            new MenuItem('visible', 'visible'),
            new MenuItem('hidden', 'hidden'),
            new MenuItem('editable', 'editable'),
            new MenuItem('required', 'required'),
            new MenuItem('optional', 'optional')
        ]
    );

    const condition = new MenuItemConfiguration(
        'Conditions',
        'condition',
        ['<condition>'],
        editor,
        actionEditor,
        [
            new MenuItem('true', 'true'),
            new MenuItem('false', 'false'),
            new MenuItem('<datafield>.value == <datafield>.value', '<datafield>.value == <datafield>.value'),
            new MenuItem('<datafield>.value != <datafield>.value', '<datafield>.value != <datafield>.value'),
            new MenuItem('<datafield>.value > <datafield>.value', '<datafield>.value > <datafield>.value'),
            new MenuItem('<datafield>.value >= <datafield>.value', '<datafield>.value >= <datafield>.value'),
            new MenuItem('<datafield>.value < <datafield>.value', '<datafield>.value < <datafield>.value'),
            new MenuItem('<datafield>.value <= <datafield>.value', '<datafield>.value <= <datafield>.value'),
            new MenuItem('<datafield>.value == <value>', '<datafield>.value == <value>'),
            new MenuItem('<datafield>.value != <value>', '<datafield>.value != <value>'),
            new MenuItem('<datafield>.value > <value>', '<datafield>.value > <value>'),
            new MenuItem('<datafield>.value >= <value>', '<datafield>.value >= <value>'),
            new MenuItem('<datafield>.value < <value>', '<datafield>.value < <value>'),
            new MenuItem('<datafield>.value <= <value>', '<datafield>.value <= <value>')
        ]
    );

    const property = new MenuItemConfiguration(
        'Properties',
        'property',
        ['<property>'],
        editor,
        actionEditor,
        [
            new MenuItem('"title"', 'title'),
            new MenuItem('"color"', 'color'),
            new MenuItem('"icon"', 'icon')
        ]
    );

    const value = new MenuItemConfiguration(
        'Values',
        'value',
        ['<value>', '<choices>', '<options>'],
        editor,
        actionEditor,
        [
            new MenuItem('<datafield>.value', '<datafield>.value'),
            new MenuItem('<datafield>.choices', '<datafield>.choices'),
            new MenuItem('<datafield>.options', '<datafield>.options'),
            new MenuItem('true', 'true'),
            new MenuItem('false', 'false'),
            new MenuItem(' ', 'Empty value'),
            new MenuItem('', 'New variable or value'),
            new MenuItem('[a,b,c]', 'List of objects'),
            new MenuItem('[a:a,b:b]', 'Map of objects'),
            new MenuItem('["a","b","c"]', 'List of strings'),
            new MenuItem('["a":"a","b":"b"]', 'Map of strings')
        ]
    );

    const type = new MenuItemConfiguration(
        'Types',
        'types',
        ['<type>'],
        editor,
        actionEditor,
        [
            new MenuItem('"text"', 'text'),
            new MenuItem('"number"', 'number'),
            new MenuItem('"date"', 'date'),
            new MenuItem('"boolean"', 'boolean'),
            new MenuItem('"file"', 'file'),
            new MenuItem('"fileList"', 'fileList'),
            new MenuItem('"enumeration"', 'enumeration'),
            new MenuItem('"enumeration_map"', 'enumeration_map'),
            new MenuItem('"multichoice"', 'multichoice'),
            new MenuItem('"multichoice_map"', 'multichoice_map'),
            new MenuItem('"userList"', 'userList'),
            new MenuItem('"tabular"', 'tabular'),
            new MenuItem('"caseRef"', 'caseRef'),
            new MenuItem('"dateTime"', 'dateTime'),
            new MenuItem('"button"', 'button'),
            new MenuItem('"taskRef"', 'taskRef'),
            new MenuItem('"filter"', 'filter'),
            new MenuItem('"i18n"', 'i18n')
        ]
    );

    const dataSet = new MenuItemConfiguration(
        'DataSet',
        'dataSet',
        ['<dataSet>'],
        editor,
        actionEditor,
        [
            new MenuItem('[<datafieldId>: ["value": <value>,"type": <type>]]', 'One data in set'),
            new MenuItem(
                '[<datafieldId>: ["value": <value>,"type": <type>],\n \t\t\t   <datafieldId>: ["value": <value>,"type": <type>]]',
                'Two data in set'
            )
        ]
    );

    const processInstanceId = new MenuItemConfiguration(
        'Process Instance Ids',
        'processInstanceId',
        ['<processInstanceId>'],
        editor,
        actionEditor,
        []
    );


    const casePredicate = new MenuItemConfiguration(
        'Case predicates',
        'casePredicate',
        ['<casePredicate>'],
        editor,
        actionEditor,
        [
            new MenuItem('<casePredicate>.and<casePredicate>', 'Predicate AND Predicate'),
            new MenuItem('<casePredicate>.or<casePredicate>', 'Predicate OR Predicate'),
            new MenuItem('{it._id.eq(<value>)}', 'Case ID equals value'),
            new MenuItem('{it.visualId.eq(<value>)}', 'Case visual ID equals value'),
            new MenuItem('{it.processIdentifier.eq("<processInstanceId>")}', 'Process identifier equals value'),
            new MenuItem('{it.title.eq(<value>)}', 'Title equals value'),
            new MenuItem('{it.author.email.eq(<value>)}', 'Authors email equals value'),
            new MenuItem('{it.author.id.eq(<value>)}', 'Authors id equals value'),
            new MenuItem('{it.author.fullName.eq(<value>)}', 'Authors full name equals value')
        ]
    );

    const taskPredicate = new MenuItemConfiguration(
        'Task predicates',
        'taskPredicate',
        ['<taskPredicate>'],
        editor,
        actionEditor,
        [
            new MenuItem('<taskPredicate>.and<taskPredicate>', 'Predicate AND Predicate'),
            new MenuItem('<taskPredicate>.or<taskPredicate>', 'Predicate OR Predicate'),
            new MenuItem('{it.id.eq(<value>)}', 'Task ID equals value'),
            new MenuItem('{it.transitionId.eq(<value>)}', 'TransitionId equals value'),
            new MenuItem('{it.caseId.eq(<value>)}', 'CaseId equals value'),
            new MenuItem('{it.caseTitle.eq(<value>)}', 'Case title equals value')
        ]
    );

    const all = [
        transition,
        dataField,
        behaviour,
        type,
        condition,
        property,
        value,
        dataSet,
        processInstanceId,
        casePredicate,
        taskPredicate
    ];

    const keywordConfigPairs: Array<{ keyword: string; config: MenuItemConfiguration }> = [];
    for (const cfg of all) {
        for (const kw of cfg.keywords) {
            keywordConfigPairs.push({ keyword: kw, config: cfg });
        }
    }

    const defaultExpandedTypes = new Set<string>();

    return {
        transition,
        dataField,
        behaviour,
        condition,
        property,
        value,
        type,
        dataSet,
        processInstanceId,
        casePredicate,
        taskPredicate,
        all,
        keywordConfigPairs,
        defaultExpandedTypes
    };
}

export function findConfigForCursor(
    editor: any,
    keywordConfigPairs: Array<{ keyword: string; config: MenuItemConfiguration }>
): MenuItemConfiguration | null {
    if (!editor || !keywordConfigPairs?.length) {
        return null;
    }
    const model = editor.getModel();
    const position = editor.getPosition();
    const selection = editor.getSelection();
    if (!model || !position || !selection) {
        return null;
    }

    if (!selection.isEmpty()) {
        const selectedText = model.getValueInRange(selection).trim();
        const bySelection = keywordConfigPairs.find(p => p.keyword === selectedText);
        if (bySelection) {
            return bySelection.config;
        }
    }

    const lineText = model.getLineContent(position.lineNumber);
    const cursorIndex = position.column - 1;

    for (const pair of keywordConfigPairs) {
        const kw = pair.keyword;
        let idx = lineText.indexOf(kw);

        while (idx !== -1) {
            const end = idx + kw.length;
            if (cursorIndex >= idx && cursorIndex <= end) {
                return pair.config;
            }
            idx = lineText.indexOf(kw, idx + 1);
        }
    }
    return null;
}

export function buildAssistantContextFromModel(
    modelService: ModelService,
    cfgs: {
        behaviour: MenuItemConfiguration;
        condition: MenuItemConfiguration;
        property: MenuItemConfiguration;
        value: MenuItemConfiguration;
        type: MenuItemConfiguration;
        dataSet: MenuItemConfiguration;
        casePredicate: MenuItemConfiguration;
        taskPredicate: MenuItemConfiguration;
    },
    action: EditableAction | any
): string {
    try {
        const model = modelService?.model;

        const list = (label: string, rows: string[]) =>
            rows?.length ? `## ${label}\n- ${rows.join('\n- ')}\n` : '';

        const transitions = (model?.getTransitions?.() ?? [])
            .map((t: any) => `${t.id}${t?.label?.value ? ` (${t.label.value})` : ''}`);

        const dataFields = (model?.getDataSet?.() ?? [])
            .map((f: any) => {
                const typ = (f as any)?.type ?? (f as any)?.component ?? '';
                const title = f?.title?.value ? ` (${f.title.value})` : '';
                return `${f.id}${title}${typ ? ` : ${typ}` : ''}`;
            });

        const takeValues = (cfg?: MenuItemConfiguration) =>
            (cfg?.items ?? []).map((i: any) => i.value || i.id || i.title).filter(Boolean);

        const behaviours = takeValues(cfgs.behaviour);
        const conditions = takeValues(cfgs.condition);
        const properties = takeValues(cfgs.property);
        const values = takeValues(cfgs.value);
        const types = takeValues(cfgs.type);
        const datasetSnips = takeValues(cfgs.dataSet);
        const casePred = takeValues(cfgs.casePredicate);
        const taskPred = takeValues(cfgs.taskPredicate);

        const meta = (() => {
            const a = action as any;
            const parts: string[] = [];
            if (a?.id) parts.push(`id=${a.id}`);
            if (a?.event) parts.push(`event=${a.event}`);
            if (a?.phase) parts.push(`phase=${a.phase}`);
            if (a?.type) parts.push(`type=${a.type}`);
            return parts.length ? `Action meta: ${parts.join(', ')}` : '';
        })();

        return [
            meta,
            list('Transitions', transitions),
            list('Data Fields', dataFields),
            list('Behaviour Templates', behaviours),
            list('Condition Templates', conditions),
            list('Property Keys', properties),
            list('Value Snippets', values),
            list('Data Types', types),
            list('DataSet Snippets', datasetSnips),
            list('Case Predicates', casePred),
            list('Task Predicates', taskPred)
        ].filter(Boolean).join('\n');
    } catch {
        return '(no context)';
    }
}
