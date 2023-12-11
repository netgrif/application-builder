export interface CommandAction {
    label?: string;
    action?: string;
    header?: string;
    description?: string;
    example?: string;
}

export interface CommandActions {
    label?: string;
    badge?: string;
    actions?: Array<CommandAction>;
}

export const actions: Array<CommandActions> = [
    {
        label: 'Basic functions',
        badge: 'code',
        actions: [
            {
                label: 'If/Else Statement',
                header: 'If/Else Statement',
                action: 'if (<condition>) {\n\t\n}else {\n\t\n}',
                description: 'The general working of this statement is that first a condition is evaluated ' +
                    'in the if statement. If the condition is true it then executes the statements ' +
                    'thereafter and stops before the else condition and exits out of the loop. If ' +
                    'the condition is false it then executes the statements in the else statement ' +
                    'block and then exits the loop.',
                example: 'if (a<100) { \n' +
                    '  println("The value is less than 100"); \n' +
                    '  } else { \n' +
                    '  println("The value is greater than 100"); \n' +
                    '}'
            },
            {
                label: 'Nested If Statement',
                header: 'Nested If Statement',
                action: 'if (<condition>) {\n\t\n} else if (<condition>) {\n\t\n} else {\n\t\n}',
                description: 'The general working of this statement is that first a condition is evaluated' +
                    'in the if statement. If the condition is true it then executes the statements ' +
                    'thereafter and stops before the else condition and exits out of the loop. If' +
                    'the condition is false it then executes the statements in the else if statements' +
                    'and finally in else block and then exits the loop.',
                example: 'if (a<100) { \n' +
                    '  println("The value is less than 100"); \n' +
                    '} else if(a < 50) { \n' +
                    '  println("The value is less than 50"); \n' +
                    '} else { \n' +
                    '  println("The value is greater than 50 and 100"); \n' +
                    '}'
            },
            {
                label: 'Switch Statement',
                header: 'Switch Statement',
                action: 'switch(<value>) {\n\tcase 1:\n\t\t\n\t\tbreak;\n\tcase 2:\n\t\t\n\t\tbreak;\n\tdefault:\n\t\t\n\t\tbreak;\n}\n',
                description: 'Nested if-else statement is so common and is used so often that an easier statement was designed called the switch statement.',
                example: 'int a = 2\n' +
                    'switch(a) {\n' +
                    '  case 1: \n' +
                    '    println("The value of a is One"); \n' +
                    '    break; \n' +
                    '  case 2: \n' +
                    '    println("The value of a is Two"); \n' +
                    '    break; \n' +
                    '  case 3: \n' +
                    '    println("The value of a is Three"); \n' +
                    '    break; \n' +
                    '  default: \n' +
                    '    println("The value is unknown"); \n' +
                    '    break; \n' +
                    '}'
            },
            {
                label: 'While Statement',
                header: 'While Statement',
                action: 'while(<condition>){\n\n}',
                description: 'The while statement is executed by first evaluating the condition expression (a Boolean value), ' +
                    'and if the result is true, then the statements in the while loop are executed. The process is repeated starting ' +
                    'from the evaluation of the condition in the while statement. This loop continues until the condition evaluates to ' +
                    'false. When the condition becomes false, the loop terminates',
                example: 'int count = 0;\n' +
                    'while(count<5) {\n' +
                    '  println(count);\n' +
                    '  count++;\n' +
                    '}'
            },
            {
                label: 'For-in statement',
                header: 'For-in statement',
                action: 'for(<value> in <value>){\n\t\n}',
                description: 'The for-in statement is used to iterate through a set of values.',
                example: 'int[] array = [0,1,2,3]; \n' +
                    'for(int i in array) { \n' +
                    '  println(i); \n' +
                    '} '
            },
            {
                label: 'Groovy tutorial',
                header: 'Groovy tutorials point',
                description: '<a href="https://www.tutorialspoint.com/groovy/index.htm" target="_blank"></a> Link to the Groovy Tutorials Point: https://www.tutorialspoint.com/groovy/index.htm'
            }
        ]
    },
    {
        label: 'Data fields',
        badge: 'edit',
        actions: [
            {
                label: 'Change value',
                header: 'change <Field f> value <Closure calculation>',
                action: 'change <datafield> value { <value>; }',
                description: 'Sets new value to data field f returned by calculation closure. If the returned value is null, fields value is set to default value. ' +
                    'If the returned value is unchanged, fields value is unchanged and actions with a trigger set on given field are not triggered.\n' +
                    '\n',
                example: 'period: f.108001,\n' +
                    'sum: f.308011;\n' +
                    'change period value {\n' +
                    '    def limit = 20.0;\n' +
                    '    if (period.value == "half-year")\n' +
                    '        limit = 40.0;\n' +
                    '    if (period.value == "quater-year")\n' +
                    '        limit = 80.0;\n' +
                    '    if ((sum.value as Double) < (limit as Double))\n' +
                    '        return "year";\n' +
                    '    return unchanged;\n' +
                    '}\n' +
                    '                            '
            },
            {
                label: 'Change choices',
                header: 'change <Field f> choices <Closure calculation>',
                action: 'change <datafield> choices { <choices>; }',
                description: 'Sets a new set of choices to data field f.',
                example: 'other: f.410001,\n' +
                    'field: f.field;\n' +
                    'change field choices {\n' +
                    '    if (other.value == "Real estate")\n' +
                    '        return field.choices + ["construction site"];\n' +
                    '    return field.choices;\n' +
                    '}\n' +
                    '                            '
            },
            {
                label: 'Change options',
                header: 'change <Field f> options <Closure calculation>',
                action: 'change <datafield> options { <options>; }',
                description: 'Sets a new map of options to data field f.',
                example: 'other: f.410001,\n' +
                    'field: f.field;\n' +
                    'change field options {\n' +
                    '    if (other.value == "Real estate")\n' +
                    '        return field.options + ["cs":"construction site"];\n' +
                    '    return field.choices;\n' +
                    '}\n'
            },
            {
                label: 'Change allowed nets',
                header: 'change <Field f> allowedNets <Closure nets>',
                action: 'change <datafield> allowedNets { <netIds>; }',
                description: 'Sets a new map of options to data field f.',
                example: 'other: f.410001,\n' +
                    'field: f.field;\n' +
                    'change field options {\n' +
                    '    if (other.value == "Real estate")\n' +
                    '        return field.options + ["cs":"construction site"];\n' +
                    '    return field.choices;\n' +
                    '}\n'
            },
            {
                label: 'Change behaviour',
                header: 'make <Field f>,<Closure behaviour> on <Transition t> when <Closure<Boolean> condition>',
                action: 'make <datafield>, <behaviour> on <transition> when { <condition> }',
                description: 'Changes behaviour of given data field f on transition t, if condition returns true\n' +
                    '\n',
                example: 'garage_check: f.garage_check,\n' +
                    'garage_cost: f.garage_cost,\n' +
                    'garage: t.garage;\n' +
                    'make garage_cost,visible on garage when {\n' +
                    '\treturn garage_check.value == true;\n' +
                    '}\n' +
                    '            '
            },
            {
                label: 'Change multiple behaviour',
                header: 'make <List<Field> f>,<Closure behaviour> on <List<Transition> t> when <Closure<Boolean> condition>',
                action: 'make [<datafields>], <behaviour> on ([<transitions>]) when { <condition> }',
                description: 'Changes behaviour of given data fields f on tasks t, if condition returns true\n' +
                    'Tasks can be referenced by list of transition references, list of task ids or list of task references',
                example:
                    'condition: f.conditionId,\n' +
                    'text: f.textId,\n' +
                    'anotherText: f.anotherTextId,\n' +
                    'transition: t.transitionId,\n' +
                    'anotherTransition: t.anotherTransitionId;\n' +
                    'make [text, anotherText], visible on ([transition, anotherTransition]) when { condition.value == true }' +
                    '---' +
                    'taskRef: f.taskRef_0;\n' +
                    'def tasks = [taskService.findOne(taskRef_0.value[0])] as List\n' +
                    'def field = getFieldOfTask(tasks[0].stringId, "referenced_text")\n' +
                    'make [field], editable on tasks when { true }'
            },
            {
                label: 'Set datafields by transition',
                header: 'SetDataEventOutcome setData(Transition transition, Map dataSet)',
                action: 'setData(<transition>, <dataSet>);',
                description: 'Sets values of data fields on task of transition in current case. Values are mapped to data fields in dataSet using data fields import Id as key.\n' +
                    '\n',
                example: 'transition: t.edit_limit;\n' +
                    'setData(transition, [\n' +
                    '    "new_limit": [\n' +
                    '        "value": "10000",\n' +
                    '        "type" : "number"\n' +
                    '    ],\n' +
                    '])'
            },
            {
                label: 'Set datafields by task',
                header: 'SetDataEventOutcome setData(Task task, Map dataSet)',
                action: 'setData(<task>, <dataSet>);',
                description: 'Sets values of data fields on task. Values are mapped to data fields in dataSet using data fields import Id as key.\n' +
                    '\n',
                example:
                    'taskRef: f.taskRef;' +
                    'def task = findTask(taskRef.value.first())' +
                    'setData(task, [\n' +
                    '    "new_limit": [\n' +
                    '        "value": "10000",\n' +
                    '        "type" : "number"\n' +
                    '    ],\n' +
                    '])'
            },
            {
                label: 'Set datafields by transitionId',
                header: 'setData(String transitionId, Case useCase, Map dataSet)',
                action: 'setData(<transitionId>, <processInstanceId>, <dataSet>);',
                description: 'Sets values of data fields on task identified by transitionId of given case. Values are mapped to data fields in dataSet using data fields import Id as key.\n' +
                    '\n',
                example: 'def usecase = findCase({ it.title.eq("Limits") }).first()\n' +
                    'setData("edit_limit", usecase, [\n' +
                    '    "new_limit": [\n' +
                    '        "value": "10000",\n' +
                    '        "type" : "number"\n' +
                    '    ],\n' +
                    '])'
            },
            {
                label: 'Set datafields by task',
                header: 'setData(String taskId, Map dataSet)',
                action: 'setData(<taskId>, <dataSet>);',
                description: 'Sets values of data fields on task identified by its Id. Values are mapped to data fields in dataSet using data fields import Id as key.\n' +
                    '\n',
                example: 'def usecase = findCase({ it.title.eq("Limits") }).first()\n' +
                    'setData("edit_limit", usecase, [\n' +
                    '    "new_limit": [\n' +
                    '        "value": "10000",\n' +
                    '        "type" : "number"\n' +
                    '    ],\n' +
                    '])'
            },
            {
                label: 'Get datafields by transition',
                header: 'Map<String, Field> getData(Transition transition)\n',
                action: 'getData(<transition>);',
                description: 'Gets all data fields on the task of transition in the current case, mapped by its import Id.\n' +
                    '\n',
                example: 'view_limit: t.view_limit;\n' +
                    'actual_limit: f.actual_limit;\n' +
                    'def data = getData(view_limit)\n' +
                    'change actual_limit value {\n' +
                    '    data["remote_limit"].value\n' +
                    '}'
            },
            {
                label: 'Get datafields by transitionId',
                header: 'Map<String, Field> getData(String transitionId, Case useCase))',
                action: 'getData(<transitionId>, <processInstanceId>);',
                description: 'Gets all data fields on the task defined by its transitionId in given case, mapped by its import Id.\n',
                example: 'view_limit: t.view_limit;\n' +
                    'def usecase = findCase({ it.title.eq("Limits") }).first()\n' +
                    'def data = getData("view_limit", usecase)\n' +
                    'change actual_limit value {\n' +
                    '    data["remote_limit"].value\n' +
                    '}'
            },
            {
                label: 'Get datafields by transition',
                header: 'Map<String, Field> getData(Task task)',
                action: 'getData(<task>);',
                description: 'Gets all data fields on the task, mapped by its import Id.',
                example:
                    'taskRef: f.taskRef;' +
                    'def task = findTask(taskRef.value.first());' +
                    'def data = getData(task)',
            },
            {
                label: 'Get datafields by transition',
                header: 'Map<String, Field> getData(String taskId)',
                action: 'getData(<taskId>);',
                description: 'Gets all data fields on the task of transition in the current case, mapped by its import Id.',
                example:
                    'taskRef: f.taskRef;' +
                    'def data = getData(taskRef.value.first())',
            },
        ]
    },
    {
        label: 'Process instances / Cases',
        badge: 'business',
        actions: [
            {
                label: 'Create a new instance of process using process identifier',
                header: 'Case createCase(String identifier, String title = null, String color = "", User author = userService.loggedOrSystem, Locale locale = LocaleContextHolder.getLocale())',
                action: 'createCase(<identifier>, <title>, <color>, <author>, <locale>);',
                description: 'Create a new instance of the newest version of process identified by the identifier. ' +
                    'If the title, color, author, or locale is not specified then the default value will be used',
                example: 'createCase("create_case_net","Create Case Case","color-fg-amber-500", otherUser);\n' +
                    'createCase("create_case_net","Create Case Case","color-fg-amber-500");\n' +
                    'createCase("create_case_net","Create Case Case");\n' +
                    'createCase("create_case_net");'
            },
            {
                label: 'Create a new instance of process using process reference',
                header: 'Case createCase(PetriNet net, String title = net.defaultCaseName.getTranslation(locale), String color = "", IUser author = userService.loggedOrSystem, Locale locale = LocaleContextHolder.getLocale())',
                action: 'createCase(<process>, <title>, <color>, <author>, <locale>);',
                description: 'Create a new instance of given process. ' +
                    'If the title, color, author, or locale is not specified then the default value will be used',
                example:
                    'def net = useCase.petriNet;' +
                    'createCase(net);'
            },
            {
                label: 'Change the property of the case',
                header: 'changeCaseProperty <String property> about <Closure supplier>',
                action: 'changeCaseProperty <property> about { <value>; }',
                description: 'Changes the property of the current case, the new value is generated by the supplier.\n' +
                    '\n',
                example: 'trans: t.t5;\n' +
                    'changeCaseProperty "icon" about { trans.icon }\n' +
                    '                            '
            }
        ]
    },
    {
        label: 'Tasks',
        badge: 'task',
        actions: [
            {
                label: 'Get task Id by transitionId',
                header: 'String getTaskId(String transitionId, Case aCase = useCase)',
                action: 'getTaskId(<transitionId>);',
                description: 'Returns the task Id if task with given tranisitionId exists in case',
                example: 'def taskId = getTaskId("t1")'
            },
            {
                label: 'Assign Task by transitionId',
                header: 'Task assignTask(String transitionId, Case aCase = useCase, IUser user = userService.loggedOrSystem)',
                action: 'assignTask(<transitionId>);',
                description: 'Assign the task with given transitionId of given case given user. If case or user is not specified the default value will be used.',
                example: 'selectedUser: f.select_controler;\n' +
                    'if (selectedUser.value) {\n' +
                    '    def user = userService.findById(selectedUser.value.id, false)\n' +
                    '    assignTask("control", useCase, user);\n' +
                    '}\n' +
                    '                            '
            },
            {
                label: 'Assign Task by Task',
                header: 'Task assignTask(Task task, IUser user = userService.loggedOrSystem)',
                action: 'assignTask(<task>);',
                description: 'Assign the task to user. Optional parameter user identifies actor who will perform assign.\n' +
                    '\n',
                example: 'selectedUser: f.select_controler;\n' +
                    '\n' +
                    'if (selectedUser.value) {\n' +
                    '    def usecase = findCase({ it.title("Some case") }).first()\n' +
                    '    def task = findTask({ it.importId.eq("control") & it.caseId.eq(usecase.stringId) })\n' +
                    '    def user = userService.findById(selectedUser.value.id, false)\n' +
                    '    assignTask(task, user);\n' +
                    '}'
            },
            {
                label: 'Assign Task by tasks',
                header: 'void assignTasks(List<Task> tasks, IUser assignee = userService.loggedOrSystem)',
                action: 'assignTasks(<tasks>);',
                description: 'Assign the tasks to user.' +
                    '\n',
                example: '// find all my cases and assign all their control tasks to me\n' +
                    'def cases = findCases( { it.author.id.eq(loggedUser().id)) } )\n' +
                    'def caseIds = cases.collect { it.stringId }\n' +
                    'def tasks = findTasks({ it.importId.eq("control") & it.caseId.in(cases) })\n' +
                    'assignTasks(tasks)'
            },
            {
                label: 'Cancel Task by transitionId',
                header: 'Task cancelTask(String transitionId, Case aCase = useCase, IUser user = userService.loggedOrSystem)',
                action: 'cancelTask(<transitionId>);',
                description: 'Cancels the task with given transitionId in a case.' +
                    '\n',
                example: 'def taskId = "work_task";\n' +
                    'def aCase = findCase({ it.author.id.eq(loggedUser().id) })\n' +
                    'cancelTask(taskId, aCase);                            '
            },
            {
                label: 'Cancel Task by task',
                header: 'Task cancelTask(Task task, IUser user = userService.loggedOrSystem)',
                action: 'cancelTask(<task>);',
                description: 'Cancels the provided task. Optional parameter user identifies actor who will perform cancel.\n' +
                    '\n',
                example: '// cancel the task "work_task", currently assigned to me, in the current case\n' +
                    'def task = findTask( { it.transitionId.eq("work_task") } );\n' +
                    'cancelTask(task);'
            },
            {
                label: 'Cancel Tasks',
                header: 'void cancelTasks(List<Task> tasks, IUser user = userService.loggedOrSystem)',
                action: 'cancelTasks(<tasks>);',
                description: 'Cancels all the provided tasks. Optional parameter user identifies actor who will perform cancel.\n' +
                    '\n',
                example: '// cancel the task "work_task", currently assigned to me, in the current case\n' +
                    'def tasks = findTasks( { it.transitionId.eq("work_task") } );\n' +
                    'cancelTasks(tasks);'
            },
            {
                label: 'Finish Task by transitionId',
                header: 'void finishTask(String transitionId, Case aCase = useCase, IUser user = userService.loggedOrSystem)',
                action: 'finishTask(<transitionId>);',
                description: 'Finish the task in current case with given transitionId. Optional parameter aCase identifies case which the task belongs to. Optional parameter user identifies actor who will perform cancel.\n' +
                    '\n',
                example: '// finish the task "work_task", currently assigned to me, in the current case\n' +
                    'def taskId = "work_task";\n' +
                    'def aCase = findCase({ it.author.id.eq(loggedUser().id) })\n' +
                    'finishTask(taskId, aCase);'
            },
            {
                label: 'Finish Task by task',
                header: 'void finishTask(Task task, IUser user = userService.loggedOrSystem)',
                action: 'finishTask(<task>);',
                description: 'Finish the provided task. Optional parameter user identifies actor who will perform cancel.\n' +
                    '\n',
                example: '// finish the task "work_task", currently assigned to me in current case\n' +
                    'def task = findTask( { it.transitionId.eq("work_task") & it.caseId.eq(useCase.stringId) & it.userId.eq(loggedUser().id) } );\n' +
                    'finishTask(task);'
            },
            {
                label: 'Finish Tasks by list of tasks',
                header: 'void finishTasks(List<Task> tasks, IUser finisher = userService.loggedOrSystem)',
                action: 'finishTasks(<tasks>);',
                description: 'Finish all the provided tasks. Optional parameter user identifies actor who will perform cancel.\n' +
                    '\n',
                example: '// finish all the tasks "work_task", currently assigned to me\n' +
                    'def tasks = findTasks( { it.transitionId.eq("work_task") & it.userId.eq(loggedUser().id) } );\n' +
                    'finishTasks(tasks);'
            },
            {
                label: 'Execute task',
                header: 'executeTask(String transitionId, Map dataSet)\n',
                action: 'executeTask(<transitionId>, <dataSet>)',
                description: 'Executes task, which is found by its tranitionId. Task is found then assigned, then populated by data and in the end finished by system.\n',
                example: 'executeTask(transition, [\n' +
                    '    "new_limit": [\n' +
                    '        "value": "10000",\n' +
                    '        "type" : "number"\n' +
                    '    ],\n' +
                    '])'
            },
            {
                label: 'Execute transitions',
                header: 'execute <String transitionId> where <Closure<Predicate>> with <Map>\n',
                action: 'execute <transitionId> where <closure<predicate>> with <map>',
                description: 'Executes all fireable transitions identified by the transitionId in all case where the predicate returns true. For each task following actions are called:\n' +
                    '\n' +
                    'assign to the system user\n' +
                    '\n' +
                    'save new data values\n' +
                    '\n' +
                    'finish. \n' +
                    '\n' +
                    'The predicate is a list of Querydsl queries. Every case property can be used in a query. For more info see querydsl doc and QCase javadoc.\n' +
                    '\n',
                example: 'field: f.field;\n' +
                    '\n' +
                    'execute "synchronized" where ([\n' +
                    '\t"title eq Case 1"\n' +
                    '] as List) with ([\n' +
                    '  \t"field": [\n' +
                    '     \tvalue: 128.0,\n' +
                    '        type: "number"\n' +
                    '\t]\n' +
                    '] as Map)'
            }
        ]
    },
    {
        label: 'Search',
        badge: 'search',
        actions: [
            {
                label: 'Find Cases',
                header: 'List<Case> findCases(Closure<Predicate> predicate)',
                action: 'findCases(<casePredicate>);',
                description: 'Finds all the cases that match the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.',
                example: 'List<Case> cases = findCases( { it.title.eq("Case 1") } );\n' +
                    '...\n' +
                    'List<Case> cases = findCases( { it.dataSet.get("name").value.eq("John") } );\n' +
                    '                            '
            },
            {
                label: 'Find Cases pageable',
                header: 'List<Case> findCases(Closure<Predicate> predicate, Pageable page)',
                action: 'findCases(<casePredicate>, <page>);',
                description: 'Finds all the cases that match the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate. Pageable determines the requested page number, page size, sort fields, and sort direction.',
                example: '// returns the first page of 5 cases sorted by the title\n' +
                    'List<Case> cases = findCases( { it.dataSet.get("name").value.eq("John") }, new PageRequest(0, 10, Sort.by("title").ascending() ) );\n' +
                    '...\n' +
                    '// returns the second page of 5 cases sorted from the newest to oldest\n' +
                    'List<Case> cases = findCases( { it.dataSet.get("name").value.eq("John") }, new PageRequest(1, 5, Sort.by("creationDate").descending() ) );'
            },
            {
                label: 'Find Case',
                header: 'Case findCase(Closure<Predicate> predicate)\n',
                action: 'findCase(<casePredicate>);',
                description: 'Finds the first case that matches the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.',
                example: 'Case useCase = findCase( { it.title.eq("Case 1") & it.processIdentifier.eq("insurance") } );\n' +
                    '...\n' +
                    'Case useCase = findCase( { it.dataSet.get("name").value.eq("John") & it.processIdentifier.eq("insurance") } );'
            },
            {
                label: 'Find Tasks',
                header: 'List<Task> findTasks(Closure<Predicate> predicate)',
                action: 'findTasks(<taskPredicate>);',
                description: 'Finds all tasks that match the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.\n' +
                    '\n',
                example: 'def useCase = findCase(...)\n' +
                    'Task task = findTask( { it.caseId.eq(useCase.stringId) & it.transitionId.eq("<transition>") } );'
            },
            {
                label: 'Find Tasks with pagination',
                header: 'List<Task> findTasks(Closure<Predicate> predicate, Pageable pageable)',
                action: 'findTasks(<taskPredicate>);',
                description: 'Finds all tasks that match the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.\n' +
                    '\n',
                example: 'def useCase = findCase(...)\n' +
                    'Task task = findTask( { it.caseId.eq(useCase.stringId) & it.transitionId.eq("<transition>") }, Pageable.ofSize(100));'
            },
            {
                label: 'Find Task',
                header: 'Task findTask(Closure<Predicate> predicate)',
                action: 'findTask(<taskPredicate>);',
                description: 'Finds the first task that matches the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.',
                example: 'List<Task> tasks = findTasks( { it.transitionId.eq("edit_limit") } )\n' +
                    '...\n' +
                    'def useCase = findCase(...)\n' +
                    'List<Task> tasks = findTasks( { it.caseId.eq(useCase.stringId) } );'
            },
            {
                label: 'Find Task by Id',
                header: 'Task findTask(String mongoId)',
                action: 'findTask(<taskId>);',
                description: 'Finds task with given id',
                example:
                    'taskRef: f.taskRef;' +
                    'def task = findTask(taskRef.value.first())'
            },
            {
                label: 'Find case in Elasticsearch',
                header: 'Case findCaseElastic(String query)',
                action: 'findCaseElastic(<value>);',
                description: '',
                example: ''
            },
            {
                label: 'Find cases in Elasticsearch',
                header: 'List<Case> findCasesElastic(String query, Pageable pageable)',
                action: 'findCasesElastic(<value>, <pageable>);',
                description: '',
                example: ''
            },
            {
                label: 'Count cases in Elasticsearch',
                header: 'long countCasesElastic(String query)',
                action: 'countCasesElastic(<value>);',
                description: '',
                example: ''
            }
        ]
    },
    {
        label: 'Async',
        badge: 'sync_alt',
        actions: [
            {
                label: 'Async run with execution of task',
                action: 'async.run{\n\tassignTask(<transitionId>)\n\tfinishTask(<transitionId>)\n}',
                description: ''
            }
        ]
    },
    {
        label: 'Roles',
        badge: 'people',
        actions: [
            {
                label: 'Assign Role',
                header: 'IUser assignRole(String roleMongoId, IUser user = userService.loggedUser)',
                action: 'assignRole(<roleId>);',
                description: 'Assigns role identified by roleId to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'transition: t.task;\n' +
                    'assignRole(transition.defaultRoleId);'
            },
            {
                label: 'Assign Role by import Id and process identifier',
                header: 'IUser assignRole(String roleId, String netId, IUser user = userService.loggedUser)',
                action: 'assignRole(<roleId>, <identifier>);',
                description: 'Assigns role identified by its import Id and netId to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'assignRole("role_1", "process_1");'
            },
            {
                label: 'Assign Role by import Id and process',
                header: 'IUser assignRole(String roleId, PetriNet net, IUser user = userService.loggedUser)',
                action: 'assignRole(<roleId>, <process>);',
                description: 'Assigns role identified by its import Id and process reference to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'assignRole("role_1", useCase.petriNet);'
            },
            {
                label: 'Assign Role by import Id, process identifier and version',
                header: 'IUser assignRole(String roleId, String netId, Version version, IUser user = userService.loggedUser)',
                action: 'assignRole(<roleId>, <process>);',
                description: 'Assigns role identified by its import Id, process identifier, and version to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'assignRole("role_1", useCase.petriNet);'
            },
            {
                label: 'Remove Role',
                header: 'IUser removeRole(String roleMongoId, IUser user = userService.loggedUser)',
                action: 'removeRole(<roleId>);',
                description: 'Removes role identified by roleId to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'transition: t.task;\n' +
                    'removeRole(transition.defaultRoleId);'
            },
            {
                label: 'Remove Role by import Id and process identifier',
                header: 'IUser removeRole(String roleId, String netId, IUser user = userService.loggedUser)',
                action: 'removeRole(<roleId>, <identifier>);',
                description: 'Removes role identified by its import Id and netId to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'removeRole("role_1", "process_1");'
            },
            {
                label: 'Remove Role by import Id and process',
                header: 'IUser removeRole(String roleId, PetriNet net, IUser user = userService.loggedUser)',
                action: 'removeRole(<roleId>, <process>);',
                description: 'Removes role identified by its import Id and process reference to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'removeRole("role_1", useCase.petriNet);'
            },
            {
                label: 'Remove Role by import Id, process identifier and version',
                header: 'IUser removeRole(String roleId, String netId, Version version, IUser user = userService.loggedUser)',
                action: 'removeRole(<roleId>, <identifier>, <version>);',
                description: 'Removes role identified by its import Id, process identifier, and version to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n',
                example: 'removeRole("role_1", useCase.petriNet, new Version(1,2,3));'
            }
        ]
    },
    {
        label: 'Users',
        badge: 'person',
        actions: [
            {
                label: 'Logged User',
                header: 'IUser loggedUser()\n',
                action: 'loggedUser();\n',
                description: 'Returns currently logged user.\n' +
                    '\n',
                example: 'userField: t.user;\n' +
                    'change userField value {\n' +
                    '    return loggedUser()\n' +
                    '}'
            },
            // find
            {
                label: 'Find by email',
                header: 'IUser findUserByEmail(String email)',
                action: 'findUserByEmail(<email>)',
                description: ' ',
                example: ' '
            },
            {
                label: 'Find by Id',
                header: 'IUser findUserById(String id)',
                action: 'findUserById(<userId>)',
                description: '',
                example: ''
            },
            // by email
            {
                label: 'Change email',
                header: 'changeUserByEmail (String email) email (Closure<String> cl)',
                action: 'changeUserByEmail <email> email { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change name',
                header: 'changeUserByEmail (String email) name (Closure<String> cl)',
                action: 'changeUserByEmail <email> name { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change surname',
                header: 'changeUserByEmail (String email) surname (Closure<String> cl)',
                action: 'changeUserByEmail <email> surname { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change tel',
                header: 'changeUserByEmail (String email) tel (Closure<String> cl)',
                action: 'changeUserByEmail <email> tel { <value> }',
                description: '',
                example: ''
            },
            // by id
            {
                label: 'Change email',
                header: 'changeUser (String id) email (Closure<String> cl)',
                action: 'changeUser <id> email { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change name',
                header: 'changeUser (String id) name (Closure<String> cl)',
                action: 'changeUser <id> name { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change surname',
                header: 'changeUser (String id) surname (Closure<String> cl)',
                action: 'changeUser <id> surname { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change tel',
                header: 'changeUser (String id) tel (Closure<String> cl)',
                action: 'changeUser <id> tel { <value> }',
                description: '',
                example: ''
            },
            // by reference
            {
                label: 'Change email',
                header: 'changeUser (IUser user) email (Closure<String> cl)',
                action: 'changeUser <user> email { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change name',
                header: 'changeUser (IUser user) name (Closure<String> cl)',
                action: 'changeUser <user> name { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change surname',
                header: 'changeUser (IUser user) surname (Closure<String> cl)',
                action: 'changeUser <user> surname { <value> }',
                description: '',
                example: ''
            },
            {
                label: 'Change tel',
                header: 'changeUser (IUser user) tel (Closure<String> cl)',
                action: 'changeUser <user> tel { <value> }',
                description: '',
                example: ''
            },
            // invite
            {
                label: 'Invite by email',
                header: 'MessageResource inviteUser(String email)',
                action: 'inviteUser(<email>)',
                description: '',
                example: ''
            },
            {
                label: 'Invity by request',
                header: 'MessageResource inviteUser(NewUserRequest newUserRequest)',
                action: 'inviteUser(<request>)',
                description: '',
                example: ''
            },
            // delete
            {
                label: 'Delte user by email',
                header: 'void deleteUser(String email)',
                action: 'deleteUser(<email>)',
                description: '',
                example: ''
            },
            {
                label: 'Delete user by reference',
                header: 'void deleteUser(IUser user)',
                action: 'deleteUser(<user>)',
                description: '',
                example: ''
            },
        ]
    },
    {
        label: 'Frontend functions',
        badge: 'laptop',
        actions: [
            {
                label: 'Reload task data',
                header: 'Frontend.reloadTask();',
                action: 'Frontend.reloadTask();',
                description: 'Forces web application to reload current task data',
                example: 'Frontend.reloadTask();'
            },
            {
                label: 'Validate task data',
                header: 'Frontend.validate(String taskId);',
                action: 'Frontend.validate(<taskId>);',
                description: 'Forces web application to validate given task data',
                example:
                    'def taskId = useCase.tasks.find { it.transition == "t1" }.task\n' +
                    'Frontend.validate(taskId);'
            },
            {
                label: 'Redirect to route',
                header: 'Frontend.redirect(String route);',
                action: 'Frontend.redirect(<route>);',
                description: 'Redirects user to the given route. Route must be known path of the web application, external URLs will be ignored.',
                example: 'Frontend.redirect(\'login\');'
            }
        ]
    },
    {
        label: 'PDF',
        badge: 'picture_as_pdf',
        actions: [
            {
                label: 'Generate PDF',
                header: 'generatePDF(String transitionId, String fileFieldId)',
                action: 'generatePDF(<transitionId>, <datafield>.importId)',
                description: 'Generates PDF from transition by <transitionId> (transition have to be executable) and saves it to file field by <fileFieldId>',
                example: 'file_0: f.file_0;\n' +
                    'generatePDF("t1", file_0.importId)'
            },
            // TODO: NAB-326 add description and examples
            {
                label: 'Generate PDF',
                header: 'void generatePdf(String sourceTransitionId, String targetFileFieldId,\n' +
                    '                     Case sourceCase = useCase, Case targetCase = useCase, String targetTransitionId = null,\n' +
                    '                     String template = null, List<String> excludedFields = [], Locale locale = null,\n' +
                    '                     ZoneId dateZoneId = ZoneId.systemDefault(), Integer sideMargin = 75, Integer titleMargin = 0)',
                action: '',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePdf(Transition sourceTransition, FileField targetFileField, Case sourceCase = useCase, Case targetCase = useCase,\n' +
                    '                     Transition targetTransition = null, String template = null, List<String> excludedFields = [], Locale locale = null,\n' +
                    '                     ZoneId dateZoneId = ZoneId.systemDefault(), Integer sideMargin = 75, Integer titleMargin = 0)',
                action: '',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePDF(String sourceTransitionId, String targetFileFieldId,\n' +
                    '                     Case sourceCase = useCase, Case targetCase = useCase, String targetTransitionId = null,\n' +
                    '                     String template = null, List<String> excludedFields = [], Locale locale = null,\n' +
                    '                     ZoneId dateZoneId = ZoneId.systemDefault(), Integer sideMargin = 75, Integer titleMargin = 20)',
                action: 'generatePDF(<transitionId>, <fieldId>)',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePDF(Transition sourceTransition, FileField targetFileField, Case sourceCase = useCase, Case targetCase = useCase,\n' +
                    '                     Transition targetTransition = null, String template = null, List<String> excludedFields = [], Locale locale = null,\n' +
                    '                     ZoneId dateZoneId = ZoneId.systemDefault(), Integer sideMargin = 75, Integer titleMargin = 0)',
                action: 'generatePDF(<transition>, <field>)',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePdf(String transitionId, FileField fileField, List<String> excludedFields = [])',
                action: 'generatePDF(<transitionId>, <field>)',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePdf(String transitionId, String fileFieldId, List<String> excludedFields, Case fromCase = useCase, Case saveToCase = useCase)',
                action: 'generatePDF(<transitionId>, <fieldId>, [<fieldId>]',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePdfWithTemplate(String transitionId, String fileFieldId, String template, Case fromCase = useCase, Case saveToCase = useCase)',
                action: 'generatePdfWithTemplate(<transitionId>, <fieldId>, <filePath>)',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePdfWithLocale(String transitionId, String fileFieldId, Locale locale, Case fromCase = useCase, Case saveToCase = useCase)',
                action: 'generatePdfWithLocale(<transitionId>, <fieldId>, <locale>)',
                description: '',
                example: ''
            },
            {
                label: 'Generate PDF',
                header: 'void generatePdfWithZoneId(String transitionId, String fileFieldId, ZoneId dateZoneId = ZoneId.systemDefault(), Case fromCase = useCase, Case saveToCase = useCase)',
                action: 'generatePdfWithZoneId(<transitionId>, <fieldId>)',
                description: '',
                example: ''
            },
        ]
    },
    {
        label: 'Email',
        badge: 'email',
        actions: [
            {
                label: 'Send email',
                header: 'void sendEmail(List<String> to, String subject, String body)',
                action: 'sendEmail([<email>], <subject>, <body>)',
                description: '',
                example: ''
            },
            {
                label: 'Send email',
                header: 'void sendEmail(List<String> to, String subject, String body, Map<String, File> attachments)',
                action: 'sendEmail([<email>], <subject>, <body>, [<attachmentName>: <file>])',
                description: '',
                example: ''
            },
            {
                label: 'Send email',
                header: 'void sendMail(MailDraft mailDraft)',
                action: 'sendMail(<mailDraft>)',
                description: '',
                example: ''
            },
        ]
    },
    {
        label: 'Filters',
        badge: 'filter_alt',
        actions: [
            {
                label: 'Find filters',
                header: 'List<Case> findFilters(String userInput)',
                action: 'findFilters(<value>)',
                description: '',
                example: ''
            },
            {
                label: 'Find all filters',
                header: 'List<Case> findAllFilters()',
                action: 'findAllFilters()',
                description: '',
                example: ''
            },
            {
                label: 'Export filters',
                header: 'FileFieldValue exportFilters(Collection<String> filtersToExport)',
                action: 'exportFilters(<filterIds>)',
                description: '',
                example: ''
            },
            {
                label: 'Import filters',
                header: 'List<String> importFilters()',
                action: 'importFilters()',
                description: '',
                example: ''
            },
            {
                label: 'Find default filters',
                header: 'List<Case> findDefaultFilters()',
                action: 'findDefaultFilters()',
                description: '',
                example: ''
            },
            {
                label: 'Create case filter',
                header: 'Case createCaseFilter(def title, String query, List<String> allowedNets, String icon = "", String visibility = DefaultFiltersRunner.FILTER_VISIBILITY_PRIVATE, def filterMetadata = null)',
                action: 'createCaseFilter(<value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create task filter',
                header: 'Case createTaskFilter(def title, String query, List<String> allowedNets, String icon = "", String visibility = DefaultFiltersRunner.FILTER_VISIBILITY_PRIVATE, def filterMetadata = null)',
                action: 'createTaskFilter(<value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create filter',
                header: 'Case createFilter(def title, String query, String type, List<String> allowedNets, String icon, String visibility, def filterMetadata)',
                action: 'createFilter(<value>, <value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Change filter query',
                header: 'changeFilter (Case filter) query (Closure cl)',
                action: 'changeFilter <case> query <closure>',
                description: '',
                example: ''
            },
            {
                label: 'Change filter visibility',
                header: 'changeFilter (Case filter) visibility (Closure cl)',
                action: 'changeFilter <case> visibility <closure>',
                description: '',
                example: ''
            },
            {
                label: 'Change filter allowedNets',
                header: 'changeFilter (Case filter) allowedNets (Closure cl)',
                action: 'changeFilter <case> allowedNets <closure>',
                description: '',
                example: ''
            },
            {
                label: 'Change filter filterMetadata',
                header: 'changeFilter (Case filter) filterMetadata (Closure cl)',
                action: 'changeFilter <case> filterMetadata <closure>',
                description: '',
                example: ''
            },
            {
                label: 'Change filter title',
                header: 'changeFilter (Case filter) title (Closure cl)',
                action: 'changeFilter <case> title <closure>',
                description: '',
                example: ''
            },
            {
                label: 'Change filter icon',
                header: 'changeFilter (Case filter) icon (Closure cl)',
                action: 'changeFilter <case> icon <closure>',
                description: '',
                example: ''
            },
            {
                label: 'Change filter uri',
                header: 'changeFilter (Case filter) uri (Closure cl)',
                action: 'changeFilter <case> uri <closure>',
                description: '',
                example: ''
            },
            {
                label: 'Delete filter',
                header: 'def deleteFilter(Case filter)',
                action: 'deleteFilter(<case>)',
                description: '',
                example: ''
            },
            {
                label: 'Create filter in menu',
                header: 'Case createFilterInMenu(String uri, String itemIdentifier, def itemAndFilterName, String filterQuery,\n' +
                    '                            String filterType, String filterVisibility, List<String> filterAllowedNets = [],\n' +
                    '                            String itemAndFilterIcon = "filter_none", Map<String, String> itemAllowedRoles = [:],\n' +
                    '                            Map<String, String> itemBannedRoles = [:], List<String> itemCaseDefaultHeaders = [],\n' +
                    '                            List<String> itemTaskDefaultHeaders = [], def filterMetadata = null)',
                action: 'createFilterInMenu(<value>, <value>, <value>, <value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create filter in menu',
                header: 'Case createFilterInMenu(MenuItemBody body, String filterQuery, String filterType, String filterVisibility,\n' +
                    '                            List<String> filterAllowedNets = [], def filterMetadata = null)',
                action: 'createFilterInMenu(<value>, <value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Find filter',
                header: 'Case findFilter(String name)',
                action: 'findFilter(<value>)',
                description: '',
                example: ''
            },
        ]
    },
    {
        label: 'Menu items',
        badge: 'menu',
        actions: [
            {
                label: 'Create menu item',
                header: 'Case createMenuItem(String uri, String identifier, def name, String icon = "filter_none", Case filter = null,\n' +
                    '                        Map<String, String> allowedRoles = [:], Map<String, String> bannedRoles = [:],\n' +
                    '                        List<String> caseDefaultHeaders = [], List<String> taskDefaultHeaders = [])',
                action: 'createMenuItem(<value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item allowedRoles',
                header: 'changeMenuItem (Case item) allowedRoles (Closure cl)',
                action: 'changeMenuItem <case> allowedRoles <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item bannedRoles',
                header: 'changeMenuItem (Case item) bannedRoles (Closure cl)',
                action: 'changeMenuItem <case> bannedRoles <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item caseDefaultHeaders',
                header: 'changeMenuItem (Case item) caseDefaultHeaders (Closure cl)',
                action: 'changeMenuItem <case> caseDefaultHeaders <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item taskDefaultHeaders',
                header: 'changeMenuItem (Case item) taskDefaultHeaders (Closure cl)',
                action: 'changeMenuItem <case> taskDefaultHeaders <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item filter',
                header: 'changeMenuItem (Case item) filter (Closure cl)',
                action: 'changeMenuItem <case> filter <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item uri',
                header: 'changeMenuItem (Case item) uri (Closure cl)',
                action: 'changeMenuItem <case> uri <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item title menuIcon',
                header: 'changeMenuItem (Case item) menuIcon (Closure cl)',
                action: 'changeMenuItem <case> menuIcon <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item tabIcon',
                header: 'changeMenuItem (Case item) tabIcon (Closure cl)',
                action: 'changeMenuItem <case> tabIcon <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item requireTitleInCreation',
                header: 'changeMenuItem (Case item) requireTitleInCreation (Closure cl)',
                action: 'changeMenuItem <case> requireTitleInCreation <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item useCustomView',
                header: 'changeMenuItem (Case item) useCustomView (Closure cl)',
                action: 'changeMenuItem <case> useCustomView <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Change menu item customViewSelector',
                header: 'changeMenuItem (Case item) customViewSelector (Closure cl)',
                action: 'changeMenuItem <case> customViewSelector <closure>)',
                description: '',
                example: ''
            },
            {
                label: 'Delete menu item',
                header: 'deleteMenuItem(Case item)',
                action: 'deleteMenuItem()',
                description: '',
                example: ''
            },
            {
                label: 'Create menu item',
                header: 'Case createMenuItem(MenuItemBody body)',
                action: 'createMenuItem(<value>)',
                description: '',
                example: ''
            },
            {
                label: 'Move menu item',
                header: 'void moveMenuItem(Case item, String destUri)',
                action: 'moveMenuItem(<case>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Duplicate menu item',
                header: 'Case duplicateMenuItem(Case originItem, I18nString newTitle, String newIdentifier)',
                action: 'duplicateMenuItem(<case>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Find menu item',
                header: 'Case findMenuItem(String menuItemIdentifier)',
                action: 'findMenuItem(<value>)',
                description: '',
                example: ''
            },
            {
                label: 'Find menu item by uri and name',
                header: 'Case findMenuItem(String uri, String name)',
                action: 'findMenuItem(<value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Find menu item by uri and identifier',
                header: 'Case findMenuItemByUriAndIdentifier(String uri, String identifier)',
                action: 'findMenuItemByUriAndIdentifier(<value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Exists menu item',
                header: 'boolean existsMenuItem(String menuItemIdentifier)',
                action: 'existsMenuItem(<value>)',
                description: '',
                example: ''
            },
            {
                label: 'Get filter from menu item',
                header: 'Case getFilterFromMenuItem(Case item)',
                action: 'getFilterFromMenuItem(<case>)',
                description: '',
                example: ''
            },
            {
                label: 'Create or update menu item',
                header: 'Case createOrUpdateMenuItem(String uri, String identifier, def name, String icon = "filter_none", Case filter = null,\n' +
                    '                                Map<String, String> allowedRoles = [:], Map<String, String> bannedRoles = [:],\n' +
                    '                                List<String> caseDefaultHeaders = [], List<String> taskDefaultHeaders = [])',
                action: 'createOrUpdateMenuItem(<value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create or update menu item and filter',
                header: 'Case createOrUpdateMenuItemAndFilter(String uri, String itemIdentifier, def itemAndFilterName, String filterQuery,\n' +
                    '                                         String filterType, String filterVisibility, List<String> filterAllowedNets = [],\n' +
                    '                                         String itemAndFilterIcon = "filter_none", Map<String, String> itemAllowedRoles = [:],\n' +
                    '                                         Map<String, String> itemBannedRoles = [:], List<String> itemCaseDefaultHeaders = [],\n' +
                    '                                         List<String> itemTaskDefaultHeaders = [], def filterMetadata = null)',
                action: 'createOrUpdateMenuItemAndFilter(<value>, <value>, <value>, <value>, <value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create or update menu item',
                header: 'Case createOrUpdateMenuItem(MenuItemBody body)',
                action: 'createOrUpdateMenuItemAndFilter(<value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create or update menu item and filter',
                header: 'Case createOrUpdateMenuItemAndFilter(MenuItemBody body, String filterQuery, String filterType, String filterVisibility,\n' +
                    '                                         List<String> filterAllowedNets = [], def filterMetadata = null)',
                action: 'createOrUpdateMenuItemAndFilter(<value>, <value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create or ignore menu item',
                header: 'Case createOrIgnoreMenuItem(MenuItemBody body)',
                action: 'createOrUpdateMenuItemAndFilter(<value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create or ignore menu item and filter',
                header: 'Case createOrIgnoreMenuItemAndFilter(MenuItemBody body, String filterQuery, String filterType, String filterVisibility,\n' +
                    '                                         List<String> filterAllowedNets = [], def filterMetadata = null)',
                action: 'createOrUpdateMenuItemAndFilter(<value>, <value>, <value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Create or ignore menu item and filter',
                header: 'Case updateMenuItem(Case item, MenuItemBody body)',
                action: 'updateMenuItem(<value>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Default fitler metadata',
                header: 'static Map defaultFilterMetadata(String type) ',
                action: 'defaultFilterMetadata(<value>)',
                description: '',
                example: ''
            }
        ]
    },
    {
        label: 'Import & export',
        badge: 'import_export',
        actions: [
            {
                label: 'Export cases to file',
                header: 'File exportCasesToFile(Closure<Predicate> predicate, String pathName, ExportDataConfig config = null, int pageSize = exportConfiguration.getMongoPageSize())',
                action: 'exportCasesToFile(<predicate>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Export cases to stream',
                header: 'OutputStream exportCases(Closure<Predicate> predicate, File outFile, ExportDataConfig config = null, int pageSize = exportConfiguration.getMongoPageSize())',
                action: 'exportCases(<predicate>, <file>)',
                description: '',
                example: ''
            },
            {
                label: 'Export cases to file as user',
                header: 'File exportCasesToFile(List<CaseSearchRequest> requests, String pathName, ExportDataConfig config = null,\n' +
                    '                           LoggedUser user = userService.loggedOrSystem.transformToLoggedUser(),\n' +
                    '                           int pageSize = exportConfiguration.getMongoPageSize(),\n' +
                    '                           Locale locale = LocaleContextHolder.getLocale(),\n' +
                    '                           Boolean isIntersection = false)',
                action: 'exportCasesToFile(<requests>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Export cases to stream as user',
                header: 'OutputStream exportCases(List<CaseSearchRequest> requests, File outFile, ExportDataConfig config = null,\n' +
                    '                             LoggedUser user = userService.loggedOrSystem.transformToLoggedUser(),\n' +
                    '                             int pageSize = exportConfiguration.getMongoPageSize(),\n' +
                    '                             Locale locale = LocaleContextHolder.getLocale(),\n' +
                    '                             Boolean isIntersection = false)',
                action: 'exportCasesToFile(<requests>, <file>)',
                description: '',
                example: ''
            },
            {
                label: 'Export tasks to file',
                header: 'File exportTasksToFile(Closure<Predicate> predicate, String pathName, ExportDataConfig config = null)',
                action: 'exportTasksToFile(<predicate>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Export tasks to stream',
                header: 'OutputStream exportTasks(Closure<Predicate> predicate, File outFile, ExportDataConfig config = null, int pageSize = exportConfiguration.getMongoPageSize())',
                action: 'exportTasks(<predicate>, <file>)',
                description: '',
                example: ''
            }, {
                label: 'Export tasks to file as user',
                header: 'File exportTasksToFile(List<ElasticTaskSearchRequest> requests, String pathName, ExportDataConfig config = null,\n' +
                    '                           LoggedUser user = userService.loggedOrSystem.transformToLoggedUser(),\n' +
                    '                           int pageSize = exportConfiguration.getMongoPageSize(),\n' +
                    '                           Locale locale = LocaleContextHolder.getLocale(),\n' +
                    '                           Boolean isIntersection = false)',
                action: 'exportTasksToFile(<requests>, <value>)',
                description: '',
                example: ''
            },
            {
                label: 'Export tasks to stream as user',
                header: 'OutputStream exportTasks(List<ElasticTaskSearchRequest> requests, File outFile, ExportDataConfig config = null,\n' +
                    '                             LoggedUser user = userService.loggedOrSystem.transformToLoggedUser(),\n' +
                    '                             int pageSize = exportConfiguration.getMongoPageSize(),\n' +
                    '                             Locale locale = LocaleContextHolder.getLocale(),\n' +
                    '                             Boolean isIntersection = false)',
                action: 'exportTasks(<requests>, <file>)',
                description: '',
                example: ''
            },
        ]
    },
    {
        label: 'Uri',
        badge: 'link',
        actions: [
            {
                label: 'Get Uri node',
                header: 'getUri(String uri)',
                action: '',
                description: '',
                example: ''
            },
            {
                label: 'Create Uri node',
                header: 'createUri(String uri, UriContentType type)',
                action: '',
                description: '',
                example: ''
            },
            {
                label: 'Move Uri node',
                header: 'moveUri(String uri, String dest)',
                action: '',
                description: '',
                example: ''
            },
            {
                label: 'Make url',
                header: 'String makeUrl(String publicViewUrl = publicViewProperties.url, String identifier)',
                action: 'makeUrl(<value>)',
                description: '',
                example: ''
            },

        ]
    },
    {
        label: 'Custom functions',
        badge: 'functions',
        actions: []
    },
];
