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
          '}',
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
          '}',
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
          '}',
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
          '}',
      },
      {
        label: 'For-in statement',
        header: 'For-in statement',
        action: 'for(<value> in <value>){\n\t\n}',
        description: 'The for-in statement is used to iterate through a set of values.',
        example: 'int[] array = [0,1,2,3]; \n' +
          'for(int i in array) { \n' +
          '  println(i); \n' +
          '} ',
      },
      {
        label: 'Groovy tutorial',
        header: 'Groovy tutorials point',
        description: '<a href="https://www.tutorialspoint.com/groovy/index.htm" target="_blank"></a> Link to the Groovy Tutorials Point: https://www.tutorialspoint.com/groovy/index.htm',
      },
    ],
  },
  {
    label: 'Datafields',
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
          '                            ',
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
          '                            ',
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
          '}\n',
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
          '            ',
      },
      {
        label: 'Set datafields by transition',
        header: 'setData(Transition transition, Map dataSet)',
        action: 'setData(<transition>, <dataSet>);',
        description: 'Sets values of data fields on task of transition in current case. Values are mapped to data fields in dataSet using data fields import Id as key.\n' +
          '\n',
        example: 'transition: t.edit_limit;\n' +
          'setData(transition, [\n' +
          '    "new_limit": [\n' +
          '        "value": "10000",\n' +
          '        "type" : "number"\n' +
          '    ],\n' +
          '])',
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
          '])',
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
          '}',
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
          '}',
      },
    ],
  },
  {
    label: 'Process instances / Cases',
    badge: 'business',
    actions: [
      {
        label: 'Create a new instance of process using process identifier',
        header: 'Case createCase(String identifier, String title = null, String color = "", User author = userService.loggedOrSystem)',
        action: 'createCase(<processInstanceId>, <title>, <color>, <author>);',
        description: 'Create a new instance of the newest version of process identified by the identifier. ' +
          'If the title is not specified, nets default case name is used. If the colour is null, the default ' +
          'colour is used.\n' +
          '\n',
        example: 'createCase("create_case_net","Create Case Case","color-fg-amber-500", otherUser);\n' +
          'createCase("create_case_net","Create Case Case","color-fg-amber-500");\n' +
          'createCase("create_case_net","Create Case Case");\n' +
          'createCase("create_case_net");',
      },
      {
        label: 'Change the property of the case',
        header: 'changeCaseProperty <String property> about <Closure supplier>',
        action: 'changeCaseProperty <property> about { <value>; }',
        description: 'Changes the property of the current case, the new value is generated by the supplier.\n' +
          '\n',
        example: 'trans: t.t5;\n' +
          'changeCaseProperty "icon" about { trans.icon }\n' +
          '                            ',
      },
    ],
  },
  {
    label: 'Tasks',
    badge: 'task',
    actions: [
      {
        label: 'Assign Task by transitionId',
        header: 'Task assignTask(String transitionId, User user = userService.loggedOrSystem)',
        action: 'assignTask(<transitionId>);',
        description: 'Assign the task in current case with given transitionId. Optional parameter user identifies actor who will perform assign.',
        example: 'selectedUser: f.select_controler;\n' +
          'if (selectedUser.value) {\n' +
          '    def user = userService.findById(selectedUser.value.id, false)\n' +
          '    assignTask("control", user);\n' +
          '}\n' +
          '                            ',
      },
      {
        label: 'Assign Task by Task',
        header: 'Task assignTask(Task task, User user = userService.loggedOrSystem)\n',
        action: 'assignTask(<transition>);',
        description: 'Assign the task to user. Optional parameter user identifies actor who will perform assign.\n' +
          '\n',
        example: 'selectedUser: f.select_controler;\n' +
          '\n' +
          'if (selectedUser.value) {\n' +
          '    def usecase = findCase({ it.title("Some case") }).first()\n' +
          '    def task = findTask({ it.importId.eq("control") & it.caseId.eq(usecase.stringId) })\n' +
          '    def user = userService.findById(selectedUser.value.id, false)\n' +
          '    assignTask(task, user);\n' +
          '}',
      },
      {
        label: 'Assign Task by tasks',
        header: 'assignTasks(List<Task> tasks, User assignee = userService.loggedOrSystem)\n',
        action: 'assignTasks(<tasks>);',
        description: 'Assign the tasks to user. Optional parameter user identifies actor who will perform assign.\n' +
          '\n',
        example: '// find all my cases and assign all their control tasks to me\n' +
          'def cases = findCases( { it.author.id.eq(loggedUser().id)) } )\n' +
          'def caseIds = cases.collect { it.stringId }\n' +
          'def tasks = findTasks({ it.importId.eq("control") & it.caseId.in(cases) })\n' +
          'assignTasks(tasks)',
      },
      {
        label: 'Cancel Task by transitionId',
        header: 'cancelTask(String transitionId, User user = userService.loggedOrSystem)\n',
        action: 'cancelTask(<transitionId>);',
        description: 'Cancels the task in current case with given transitionId. Optional parameter user identifies actor who will perform cancel.\n' +
          '\n',
        example: 'def taskId = "work_task";\n' +
          'def aCase = findCase({ it.author.id.eq(loggedUser().id) })\n' +
          'cancelTask(taskId, aCase);                            ',
      },
      {
        label: 'Cancel Task by task',
        header: 'cancelTask(Task task, User user = userService.loggedOrSystem)\n',
        action: 'cancelTask(<task>);',
        description: 'Cancels the provided task. Optional parameter user identifies actor who will perform cancel.\n' +
          '\n',
        example: '// cancel the task "work_task", currently assigned to me, in the current case\n' +
          'def task = findTask( { it.transitionId.eq("work_task") } );\n' +
          'cancelTask(task);',
      },
      {
        label: 'Cancel Tasks',
        header: 'cancelTasks(List<Task> tasks, User user = userService.loggedOrSystem)\n',
        action: 'cancelTasks(<tasks>);',
        description: 'Cancels all the provided tasks. Optional parameter user identifies actor who will perform cancel.\n' +
          '\n',
        example: '// cancel the task "work_task", currently assigned to me, in the current case\n' +
          'def tasks = findTasks( { it.transitionId.eq("work_task") } );\n' +
          'cancelTasks(tasks);',
      },
      {
        label: 'Finish Task by transitionId',
        header: 'finishTask(String transitionId, Case aCase = useCase, User user = userService.loggedOrSystem)\n',
        action: 'finishTask(<transitionId>);',
        description: 'Finish the task in current case with given transitionId. Optional parameter aCase identifies case which the task belongs to. Optional parameter user identifies actor who will perform cancel.\n' +
          '\n',
        example: '// finish the task "work_task", currently assigned to me, in the current case\n' +
          'def taskId = "work_task";\n' +
          'def aCase = findCase({ it.author.id.eq(loggedUser().id) })\n' +
          'finishTask(taskId, aCase);',
      },
      {
        label: 'Finish Task by task',
        header: 'finishTask(Task task, User user = userService.loggedOrSystem)\n',
        action: 'finishTask(<task>);',
        description: 'Finish the provided task. Optional parameter user identifies actor who will perform cancel.\n' +
          '\n',
        example: '// finish the task "work_task", currently assigned to me in current case\n' +
          'def task = findTask( { it.transitionId.eq("work_task") & it.caseId.eq(useCase.stringId) & it.userId.eq(loggedUser().id) } );\n' +
          'finishTask(task);',
      },
      {
        label: 'Finish Tasks by list of tasks',
        header: 'finishTasks(List<Task> tasks, User user = userService.loggedOrSystem)\n',
        action: 'finishTasks(<tasks>);',
        description: 'Finish all the provided tasks. Optional parameter user identifies actor who will perform cancel.\n' +
          '\n',
        example: '// finish all the tasks "work_task", currently assigned to me\n' +
          'def tasks = findTasks( { it.transitionId.eq("work_task") & it.userId.eq(loggedUser().id) } );\n' +
          'finishTasks(tasks);',
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
          '])',
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
          '] as Map)',
      },
    ],
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
          '                            ',
      },
      {
        label: 'Find Cases pageable',
        header: 'List<Case> findCases(Closure<Predicate> predicate, Pageable page) \n',
        action: 'findCases(<casePredicate>, <page>);',
        description: 'Finds all the cases that match the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate. Pageable determines the requested page number, page size, sort fields, and sort direction.',
        example: '// returns the first page of 5 cases sorted by the title\n' +
          'List<Case> cases = findCases( { it.dataSet.get("name").value.eq("John") }, new PageRequest(0, 10, Sort.by("title").ascending() ) );\n' +
          '...\n' +
          '// returns the second page of 5 cases sorted from the newest to oldest\n' +
          'List<Case> cases = findCases( { it.dataSet.get("name").value.eq("John") }, new PageRequest(1, 5, Sort.by("creationDate").descending() ) );',
      },
      {
        label: 'Find Case',
        header: 'Case findCase(Closure<Predicate> predicate)\n',
        action: 'findCase(<casePredicate>);',
        description: 'Finds the first case that matches the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.',
        example: 'Case useCase = findCase( { it.title.eq("Case 1") & it.processIdentifier.eq("insurance") } );\n' +
          '...\n' +
          'Case useCase = findCase( { it.dataSet.get("name").value.eq("John") & it.processIdentifier.eq("insurance") } );',
      },
      {
        label: 'Find Tasks',
        header: 'List<Task> findTasks(Closure<Predicate> predicate)',
        action: 'findTasks(<taskPredicate>);',
        description: 'Finds all tasks that match the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.\n' +
          '\n',
        example: 'def useCase = findCase(...)\n' +
          'Task task = findTask( { it.caseId.eq(useCase.stringId) & it.transitionId.eq("<transition>") } );\n' +
          '                            ',
      },
      {
        label: 'Find Task',
        header: 'Task findTask(Closure<Predicate> predicate)\n',
        action: 'findTask(<taskPredicate>);',
        description: 'Finds the first task that matches the given predicate. The predicate is a groovy closure that accepts QCase object and returns QueryDSL Predicate.',
        example: 'List<Task> tasks = findTasks( { it.transitionId.eq("edit_limit") } )\n' +
          '...\n' +
          'def useCase = findCase(...)\n' +
          'List<Task> tasks = findTasks( { it.caseId.eq(useCase.stringId) } );',
      },
    ],
  },
  {
    label: 'Async',
    badge: 'sync_alt',
    actions: [
      {
        label: 'Async run with execution of task',
        action: 'async.run{\n\tassignTask(<transitionId>)\n\tfinishTask(<transitionId>)\n}',
        description: '',
      },
    ],
  },
  {
    label: 'Roles',
    badge: 'man',
    actions: [
      {
        label: 'Assign Role',
        header: 'User assignRole(String roleId, User user = userService.loggedUser)\n',
        action: 'assignRole(<roleId>);',
        description: 'Assigns role identified by roleId to user. User is optional parameter, default value is currently logged user. Returns updated object of user.\n' +
          '\n',
        example: 'transition: t.task;\n' +
          'assignRole(transition.defaultRoleId);',
      },
      {
        label: 'Logged User',
        header: 'User loggedUser()\n',
        action: 'loggedUser();\n',
        description: 'Returns currently logged user.\n' +
          '\n',
        example: 'userField: t.user;\n' +
          'change userField value {\n' +
          '    return loggedUser()\n' +
          '}',
      },
    ],
  },
  {
    label: 'Integrations & others',
    badge: 'workspaces',
    actions: [
      {
        label: 'Slovak postal code',
        action: 'psc(byCode,<value>);',
        description: 'Calls a web service that will get names of places with code inserted into <value>',
        example:
          'field: f.postal,\n' +
          'city: f.city;\n' +
          'change city choices {\n' +
          '    def postals = psc byCode,field.value;\n' +
          '    return postals.collect({it.city}).unique();',
      },
      {
        label: 'Generate PDF',
        header: 'generatePDF(String transitionId, String fileFieldId)',
        action: 'generatePDF(<transitionId>, <datafield>.importId)',
        description: 'Generates PDF from transition by <transitionId> (transition have to be executable) and saves it to file field by <fileFieldId>',
        example: 'file_0: f.file_0;\n' +
          'generatePDF("t1", file_0.importId)',
      },
    ],
  },
  {
    label: 'Custom functions',
    badge: 'functions',
    actions: [],
  },
];
