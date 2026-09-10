interface FieldMember {
    name: string;
    type: string;
    documentation: string;
    parameters?: string;
    arguments?: ReadonlyArray<string>;
}

const COMMON_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'importId', type: 'String', documentation: 'Petriflow data field identifier.'},
    {name: 'stringId', type: 'String', documentation: 'Petriflow data field identifier.'},
    {name: 'type', type: 'FieldType', documentation: 'Data field type.'},
    {name: 'name', type: 'I18nString', documentation: 'Localized field name.'},
    {name: 'description', type: 'I18nString', documentation: 'Localized field description.'},
    {name: 'placeholder', type: 'I18nString', documentation: 'Localized field placeholder.'},
    {name: 'behavior', type: 'ObjectNode', documentation: 'Field behavior configuration.'},
    {name: 'layout', type: 'FieldLayout', documentation: 'Field layout configuration.'},
    {name: 'order', type: 'Long', documentation: 'Field order.'},
    {name: 'immediate', type: 'Boolean', documentation: 'Whether field changes are applied immediately.'},
    {name: 'events', type: 'Map<DataEventType, DataEvent>', documentation: 'Field data events.'},
    {name: 'encryption', type: 'String', documentation: 'Field encryption configuration.'},
    {name: 'format', type: 'Format', documentation: 'Field format.'},
    {name: 'length', type: 'Integer', documentation: 'Configured field length.'},
    {name: 'component', type: 'Component', documentation: 'Custom field component.'},
    {name: 'initExpression', type: 'Expression', documentation: 'Dynamic default-value expression.'},
    {name: 'validations', type: 'List<Validation>', documentation: 'Field validations.'},
    {name: 'parentTaskId', type: 'String', documentation: 'Parent task identifier.'},
    {name: 'parentCaseId', type: 'String', documentation: 'Parent case identifier.'},
    {name: 'clearValue', type: 'void', documentation: 'Clears the current field value.', parameters: '', arguments: []},
    {name: 'hasDefault', type: 'boolean', documentation: 'Returns whether the field has a static or dynamic default value.', parameters: '', arguments: []},
    {name: 'isDynamicDefaultValue', type: 'boolean', documentation: 'Returns whether the default value is dynamic.', parameters: '', arguments: []},
    {name: 'getTranslatedName', type: 'String', documentation: 'Returns the translated field name.', parameters: 'Locale locale', arguments: ['locale']},
    {name: 'getTranslatedPlaceholder', type: 'String', documentation: 'Returns the translated placeholder.', parameters: 'Locale locale', arguments: ['locale']},
    {name: 'getTranslatedDescription', type: 'String', documentation: 'Returns the translated description.', parameters: 'Locale locale', arguments: ['locale']},
];

const TEXT_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'subType', type: 'String', documentation: 'Text input subtype, such as simple or area.'},
    {name: 'maxLength', type: 'Integer', documentation: 'Maximum text length.'},
    {name: 'formatting', type: 'String', documentation: 'Text formatting configuration.'},
];

const NUMBER_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'minValue', type: 'Double', documentation: 'Minimum accepted number.'},
    {name: 'maxValue', type: 'Double', documentation: 'Maximum accepted number.'},
];

const DATE_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'minDate', type: 'String', documentation: 'Minimum accepted date.'},
    {name: 'maxDate', type: 'String', documentation: 'Maximum accepted date.'},
];

const CHOICE_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'choices', type: 'Set<I18nString>', documentation: 'Available field choices.'},
    {name: 'expression', type: 'Expression', documentation: 'Dynamic choices expression.'},
    {name: 'dynamic', type: 'boolean', documentation: 'Whether choices are generated dynamically.'},
    {name: 'setChoicesFromStrings', type: 'void', documentation: 'Replaces choices from string values.', parameters: 'Collection<String> choices', arguments: ['choices']},
];

const MAP_OPTIONS_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'options', type: 'Map<String, I18nString>', documentation: 'Available keyed field options.'},
    {name: 'expression', type: 'Expression', documentation: 'Dynamic options expression.'},
    {name: 'dynamic', type: 'boolean', documentation: 'Whether options are generated dynamically.'},
];

const STORAGE_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'storage', type: 'Storage', documentation: 'File storage configuration.'},
    {name: 'storageType', type: 'String', documentation: 'Configured storage provider type.'},
];

const ALLOWED_NETS_MEMBER: FieldMember = {
    name: 'allowedNets',
    type: 'List<String>',
    documentation: 'Process identifiers allowed by this reference field.',
};

const TYPE_MEMBERS: Readonly<Record<string, ReadonlyArray<FieldMember>>> = {
    text: TEXT_MEMBERS,
    number: NUMBER_MEMBERS,
    date: DATE_MEMBERS,
    dateTime: DATE_MEMBERS,
    enumeration: [
        ...CHOICE_MEMBERS,
        {name: 'getTranslatedValue', type: 'String', documentation: 'Returns the translated selected value.', parameters: 'Locale locale', arguments: ['locale']},
    ],
    multichoice: CHOICE_MEMBERS,
    enumeration_map: MAP_OPTIONS_MEMBERS,
    multichoice_map: MAP_OPTIONS_MEMBERS,
    boolean: [
        {name: 'or', type: 'Boolean', documentation: 'Combines this field value with another boolean field.', parameters: 'BooleanField field', arguments: ['field']},
        {name: 'and', type: 'Boolean', documentation: 'Combines this field value with another boolean field.', parameters: 'BooleanField field', arguments: ['field']},
    ],
    actor: [{name: 'roles', type: 'Set<String>', documentation: 'Roles allowed in this actor field.'}],
    user: [{name: 'roles', type: 'Set<String>', documentation: 'Roles allowed in this actor field.'}],
    actorList: [{name: 'roles', type: 'Set<String>', documentation: 'Roles allowed in this actor-list field.'}],
    userList: [{name: 'roles', type: 'Set<String>', documentation: 'Roles allowed in this actor-list field.'}],
    caseRef: [ALLOWED_NETS_MEMBER],
    filter: [
        ALLOWED_NETS_MEMBER,
        {name: 'filterMetadata', type: 'Map<String, Object>', documentation: 'Filter-specific metadata.'},
    ],
    file: STORAGE_MEMBERS,
    fileList: [
        ...STORAGE_MEMBERS,
        {name: 'addValue', type: 'void', documentation: 'Adds a file name and path to the field value.', parameters: 'String fileName, String path', arguments: ['fileName', 'path']},
    ],
};

const VALUE_TYPES: Readonly<Record<string, string>> = {
    text: 'String',
    number: 'Double',
    boolean: 'Boolean',
    button: 'Integer',
    date: 'LocalDate',
    dateTime: 'LocalDateTime',
    enumeration: 'I18nString',
    enumeration_map: 'String',
    multichoice: 'LinkedHashSet<I18nString>',
    multichoice_map: 'LinkedHashSet<String>',
    file: 'FileFieldValue',
    fileList: 'FileListFieldValue',
    actor: 'ActorFieldValue',
    user: 'ActorFieldValue',
    actorList: 'ActorListFieldValue',
    userList: 'ActorListFieldValue',
    caseRef: 'List<String>',
    taskRef: 'List<String>',
    filter: 'String',
    i18n: 'I18nString',
    stringCollection: 'List<String>',
};

const I18N_VALUE_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'defaultValue', type: 'String', documentation: 'Default localized value.'},
    {name: 'key', type: 'String', documentation: 'Translation key.'},
    {name: 'translations', type: 'Map<String, String>', documentation: 'Translations indexed by locale.'},
    {name: 'addTranslation', type: 'void', documentation: 'Adds or replaces a translation.', parameters: 'String locale, String translation', arguments: ['locale', 'translation']},
    {name: 'getTranslation', type: 'String', documentation: 'Returns a translation for the locale.', parameters: 'String locale', arguments: ['locale']},
    {name: 'contains', type: 'boolean', documentation: 'Checks the default value and translations.', parameters: 'String value', arguments: ['value']},
];

const ACTOR_VALUE_MEMBERS: ReadonlyArray<FieldMember> = [
    {name: 'id', type: 'String', documentation: 'Actor identifier.'},
    {name: 'realmId', type: 'String', documentation: 'Actor realm identifier.'},
    {name: 'fullName', type: 'String', documentation: 'Actor display name.'},
    {name: 'firstName', type: 'String', documentation: 'User first name when the value represents a user.'},
    {name: 'lastName', type: 'String', documentation: 'User last name when the value represents a user.'},
    {name: 'username', type: 'String', documentation: 'Username when the value represents a user.'},
    {name: 'name', type: 'String', documentation: 'Group name when the value represents a group.'},
];

const VALUE_MEMBERS: Readonly<Record<string, ReadonlyArray<FieldMember>>> = {
    actor: ACTOR_VALUE_MEMBERS,
    user: ACTOR_VALUE_MEMBERS,
    actorList: [{name: 'actorValues', type: 'LinkedHashSet<ActorFieldValue>', documentation: 'Actors stored in the list.'}],
    userList: [{name: 'actorValues', type: 'LinkedHashSet<ActorFieldValue>', documentation: 'Actors stored in the list.'}],
    file: [
        {name: 'name', type: 'String', documentation: 'Original file name.'},
        {name: 'path', type: 'String', documentation: 'Stored file path.'},
        {name: 'previewPath', type: 'String', documentation: 'Stored preview path.'},
    ],
    fileList: [{name: 'namesPaths', type: 'HashSet<FileFieldValue>', documentation: 'Files stored in the list.'}],
    enumeration: I18N_VALUE_MEMBERS,
    i18n: I18N_VALUE_MEMBERS,
};

const I18N_FIELD_PATHS = new Set(['name', 'description', 'placeholder']);

export function fieldCompletionProposals(
    fieldType: string | undefined,
    path: ReadonlyArray<string>,
    range: any,
    languages: any,
): Array<any> {
    let members: ReadonlyArray<FieldMember>;
    if (path.length === 0) {
        const valueType = VALUE_TYPES[fieldType] ?? 'Object';
        members = [
            {name: 'value', type: valueType, documentation: 'Current field value.'},
            {name: 'defaultValue', type: valueType, documentation: 'Default field value.'},
            ...COMMON_MEMBERS,
            ...(TYPE_MEMBERS[fieldType] ?? []),
        ];
    } else if (path.length === 1 && path[0] === 'value') {
        members = VALUE_MEMBERS[fieldType] ?? [];
    } else if (path.length === 1 && I18N_FIELD_PATHS.has(path[0])) {
        members = I18N_VALUE_MEMBERS;
    } else if (path.length === 1 && path[0] === 'storage' && ['file', 'fileList'].includes(fieldType)) {
        members = [
            {name: 'type', type: 'String', documentation: 'Storage provider type.'},
            {name: 'host', type: 'String', documentation: 'Storage provider host.'},
            {name: 'bucket', type: 'String', documentation: 'MinIO bucket when MinIO storage is used.'},
        ];
    } else {
        members = [];
    }
    const names = new Set<string>();
    return members
        .filter(member => !names.has(member.name) && names.add(member.name))
        .map(member => memberCompletion(member, range, languages));
}

function memberCompletion(member: FieldMember, range: any, languages: any): any {
    const method = member.parameters !== undefined;
    const completion = {
        label: member.name,
        kind: method ? languages.CompletionItemKind.Function : languages.CompletionItemKind.Property,
        detail: method
            ? `${member.name}(${member.parameters}): ${member.type}`
            : `${member.name}: ${member.type}`,
        documentation: member.documentation,
        insertText: method
            ? `${member.name}(${(member.arguments ?? []).map((argument, index) => `\${${index + 1}:${argument}}`).join(', ')})`
            : member.name,
        range,
    };
    const snippetRule = languages.CompletionItemInsertTextRule?.InsertAsSnippet;
    return method && snippetRule !== undefined
        ? {...completion, insertTextRules: snippetRule}
        : completion;
}
