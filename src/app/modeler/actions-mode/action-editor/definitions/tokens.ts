export function tokenProvider() {
  return {
    defaultToken: '',
    tokenPostfix: '.java',

    keywords: [
      'abstract', 'as', 'continue', 'for', 'new', 'switch', 'assert', 'default',
      'goto', 'package', 'synchronized', 'do', 'if', 'private', 'def', 'in',
      'this', 'break', 'implements', 'protected', 'throw', 'null',
      'else', 'import', 'public', 'throws', 'case', 'enum', 'instanceof', 'return',
      'transient', 'catch', 'extends', 'try', 'final', 'threadsafe',
      'interface', 'static', 'void', 'class', 'finally', 'strictfp',
      'volatile', 'const', 'native', 'super', 'while', 'true', 'false',
      'DEFAULTLANG', 'MILLISECONDS', 'SECONDS', 'MINUTES', 'HOURS', 'DAYS',
      'WEEKS', 'MONTHS', 'YEARS', 'DATEFORMAT_DEFAULT',
    ],
    typeKeywords: [
      'boolean', 'double', 'byte', 'int', 'short', 'char', 'void', 'long', 'float', 'String', 'f.', 't.',
    ],
    actionsKeywords: [
      'log', 'UNCHANGED_VALUE', 'ALWAYS_GENERATE', 'ONCE_GENERATE', 'fieldFactory', 'taskService',
      'dataService', 'workflowService', 'userService', 'petriNetService', 'async', 'groupService',
      'memberService', 'pdfGenerator', 'mailService', 'nextGroupService', 'registrationService',
      'mailAttemptService', 'useCase', 'task', 'map', 'action', 'actionsRunner', 'changedFieldsTree',
    ],
    functions: [
      'init', 'copyBehavior', 'make', 'saveChangedValue', 'saveChangedChoices', 'saveChangedAllowedNets',
      'saveChangedOptions', 'putIntoChangedFields', 'addAttributeToChangedField', 'execute', 'executeTasks',
      'executeTask', 'searchCases', 'change', 'changeFieldValue', 'generate', 'changeCaseProperty', 'cache',
      'cacheFree', 'pcs', 'orsr', 'findCases', 'findCase', 'createCase', 'assignTask', 'assignTasks',
      'cancelTask', 'cancelTasks', 'finishTask', 'finishTasks', 'findTasks', 'findTask', 'getTaskId',
      'assignRole', 'setData', 'setDataWithPropagation', 'makeDataSetIntoChangedFields', 'getData',
      'mapData', 'findOrganisation', 'createOrganisation', 'deleteOrganisation', 'saveOrganisation',
      'removeMember', 'addMember', 'findMember', 'loggedUser', 'generatePDF', 'generatePdfWithTemplate',
      'generatePdfWithLocale', 'sendMail', 'changeUser', 'inviteUser', 'deleteUser',
    ],

    operators: [
      '=', '>', '<', '!', '~', '?', ':',
      '==', '<=', '>=', '!=', '&&', '||', '++', '--',
      '+', '-', '*', '/', '&', '|', '^', '%', '<<',
      '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
      '^=', '%=', '<<=', '>>=', '>>>=',
    ],

    // we include these common regular expressions
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    digits: /\d+(_+\d+)*/,
    octaldigits: /[0-7]+(_+[0-7]+)*/,
    binarydigits: /[0-1]+(_+[0-1]+)*/,
    hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
    tokenizer: {
      root: [
        // identifiers and keywords
        [/[a-zA-Z_$][\w$]*/, {
          cases: {
            '@keywords': {token: 'keyword.$0'},
            '@actionsKeywords': {token: 'keyword.$0'},
            '@typeKeywords': 'type.identifier',
            '@functions': 'type.identifier',
            '@default': 'identifier',
          },
        }],
        [/<[a-z][a-zA-Z_$]*[\w$]*>/, 'errorSyntax'],
        // whitespace
        {include: '@whitespace'},

        // delimiters and operators
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'delimiter',
            '@default': '',
          },
        }],

        // @ annotations.
        [/@\s*[a-zA-Z_\$][\w\$]*/, 'annotation'],

        // numbers
        [/(@digits)[eE]([\-+]?(@digits))?[fFdD]?/, 'number.float'],
        [/(@digits)\.(@digits)([eE][\-+]?(@digits))?[fFdD]?/, 'number.float'],
        [/0[xX](@hexdigits)[Ll]?/, 'number.hex'],
        [/0(@octaldigits)[Ll]?/, 'number.octal'],
        [/0[bB](@binarydigits)[Ll]?/, 'number.binary'],
        [/(@digits)[fFdD]/, 'number.float'],
        [/(@digits)[lL]?/, 'number'],

        // delimiter: after number because of .\d floats
        [/[;,.]/, 'delimiter'],

        // strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/"/, 'string', '@string'],

        // characters
        [/'[^\\']'/, 'string'],
        [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
        [/'/, 'string.invalid'],
      ],

      whitespace: [
        [/[ \t\r\n]+/, ''],
        [/\/\*\*(?!\/)/, 'comment.doc', '@javadoc'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
        [/<!--/, 'comment', '@comment2'],
      ],

      comment: [
        [/[^\/*]+/, 'comment'],
        // [/\/\*/, 'comment', '@push' ],    // nested comment not allowed :-(
        // [/\/\*/,    'comment.invalid' ],    // this breaks block comments in the shape of /* //*/
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],
      comment2: [
        [/-->/, 'comment', '@pop'],
        [/[^-]+/, 'comment.content'],
        [/./, 'comment.content'],

      ],
      // Identical copy of comment above, except for the addition of .doc
      javadoc: [
        [/[^\/*]+/, 'comment.doc'],
        // [/\/\*/, 'comment.doc', '@push' ],    // nested comment not allowed :-(
        [/\/\*/, 'comment.doc.invalid'],
        [/\*\//, 'comment.doc', '@pop'],
        [/[\/*]/, 'comment.doc'],
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, 'string', '@pop'],
      ],
    },
  };
}
