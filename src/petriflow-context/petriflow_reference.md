# Petriflow — Rules, Patterns, and Snippets

---

## ⚠️ CRITICAL — MOST FREQUENT ERRORS (verify each before outputting XML)

**C1 — `caseEvents` always `phase="post"`, never `phase="pre"`**
Data fields do not exist during the `pre` phase of a create event — any `change` on a field there fails silently at runtime. No exceptions.

**C2 — Arcs are strictly Place→Transition→Place. Never Place→Place, never Transition→Transition.**
Applies to ALL arc types: regular, read, reset, inhibitor, variable. Most common mistake in AND-join patterns: adding intermediate "done" places (`p_legal_done`, `p_finance_done`) between the review transition and the join place, then connecting them with `p_legal_done → p_join` — that last arc is Place→Place and is invalid. Fix: route each review transition **directly** into the shared join place. `review_legal → join` ✅, `review_legal → p_legal_done → join` ❌.

**C3 — Only `system`-role transitions need bootstrapping. NEVER call `assignTask` on a human task — from anywhere.**
A system-role transition never fires on its own — not even with `assignPolicy auto`. Always bootstrap from the preceding human task's `finish post`:
```groovy
async.run { assignTask("system_task_id"); finishTask("system_task_id") }
```
If the system task is reached via a variable arc, the `async.run` must be conditional on the routing decision.

> 📝 Note: PetriFlow supports `trigger type="auto"` on system transitions as a cleaner alternative that avoids a rare race condition (~1/100 under high concurrent load). However, Netgrif Builder does not support trigger editing — always use the `async.run` pattern above for Builder-compatible processes.

**Human tasks are enabled automatically when a token arrives at their input place — they NEVER need `assignTask`.** Calling `assignTask` on a human task (from `caseEvents`, transition events, or anywhere else) assigns it to the system user, permanently blocking the task for real users. This applies to ALL human tasks in ALL contexts — no exceptions.

**C4 — Routing flags (`to_x` number fields) must be set in `phase="pre"`, never `phase="post"`.**
The engine evaluates variable arc multiplicities after `pre` and before `post`. Setting flags in `post` means the token moves with `init=0` values — no arc fires. Always `phase="pre"` for routing actions.

**C5 — Every field used anywhere in an action body must be in the import header.**
Includes fields read in conditions, interpolated in strings, used in `make`, and routing flags written with `change`. Missing import = silent null pointer at runtime. Applies to `caseEvents` too — never use `f.field_id` directly in the body.

**C6 — NEVER use `&`, `<`, or `>` in XML text content.**
In every `<title>`, `<label>`, `<placeholder>`, `<desc>`, `<value>`, `<option>`, and `<message>`: do not use `&` at all — write "and" instead. Do not use `<` or `>` — rephrase. These characters break XML parsing and cause import errors.
- ❌ `<label>Review & Route</label>` → ✅ `<label>Review and Route</label>`
- ❌ `<title>Request & Background</title>` → ✅ `<title>Request and Background</title>`
- ❌ `<option key="a">A & B</option>` → ✅ `<option key="a">A and B</option>`

Inside `<![CDATA[...]]>` blocks these characters do NOT need escaping.

## ⚠️ ADDITIONAL CRITICAL RULES

**C7 — `textarea` is not a field type. `type="textarea"` does not exist.**
Always use `type="text"` with `<component><name>textarea</name></component>`. Using `type="textarea"` causes a NullPointerException on eTask import — the process cannot be uploaded at all.

**C8 — `<component>` tag uses `<name>`, never `<n>`.**
The correct child element is `<name>textarea</name>`, `<name>preview</name>`, `<name>divider</name>`, etc. Using `<n>` instead of `<name>` causes a silent rendering bug. Scan every `<component>` block before output.

**C9 — Never truncate the XML output. `</document>` is mandatory.**
Always output the complete XML in one block. If the process is large and you are approaching output limits, reduce verbosity — omit `<x>`/`<y>` coordinates, shorten IDs, merge dataGroups — but **never** stop mid-document. Never end with `...`, `<!-- remaining arcs -->`, or any similar placeholder. Every opened tag must be closed. The last line of the XML block must always be `</document>`.

If a previous generation was truncated and you are asked to fix it, do NOT regenerate from scratch. Instead, output **only the missing closing portion** — continue from the last complete element and close all open tags through to `</document>`.

**C10 — `<init>` belongs only inside `<data>`, never inside `<dataRef>`.**
`<dataRef>` defines how a field is displayed in a task — it accepts `<id>`, `<logic>`, `<layout>`, and `<event>` only. Placing `<init>` inside a `<dataRef>` causes XSD error: *"Invalid content was found starting with element 'init'. One of '{...allowedNets}' is expected."* Default values always go in the `<data>` definition block, not in `<dataRef>`.

**C11 — Every transition in the flow MUST have at least one outgoing regular arc.**
A transition that consumes a token but produces nothing is a permanent dead end — the process gets stuck forever at that task. The ONLY exception is a genuinely terminal transition (e.g. final "Done" state) at the very end of all flows. Every other transition must connect forward: `transition → place → next_transition`. Before generating arcs, trace: "where does the token go after this task fires?"

**C12 — A loop arc goes back to a PLACE, never directly to a transition.**
`rejected_place → resubmit_task` ✅ — transition waits for token in place.
`resubmit_task → submit_task` ❌ — two transitions connected directly = Place→Place equivalent, creates implicit AND-join when `submit_task` also has its initial `start` place as input. The submitter task would need BOTH `start` AND `rejected_place` tokens simultaneously — deadlock after the first rejection.
Always route the loop arc through a place: `review → p_loop(variable arc, go_reject) → resubmit → p_submitted → review`.

**C13 — A place that feeds a transition via regular arc must itself receive tokens.**
Before drawing any arc `place → transition`, verify: does this place ever get a token? Either `tokens=1` (initial) or some transition sends a regular arc INTO it. A place with `tokens=0` and no incoming arc will always be empty — the downstream transition will never fire. This is a silent deadlock with no error message.

**C14 — A task is either a flow task OR permanently open. Never both.**
- **Flow task**: regular arc IN (from place), regular arc OUT (to place). Fires once, moves token forward.
- **Permanently open task**: ONLY a read arc from a `tokens=1` place. No regular arcs in or out. Always visible.
- ❌ **Never**: regular arc IN + read arc IN + regular arc OUT — mixing both patterns creates a confused task that blocks other tasks and misleads about token flow.
- ❌ **Never**: regular arc IN + NO outgoing arc — dead end (see C11).

**C15 — Every system task must be bootstrapped AND have a reachable input.**
System tasks never fire on their own. Two conditions must both be true:
1. Some human task calls `async.run { assignTask("sys_id"); finishTask("sys_id") }` in its finish post
2. The system task's input place actually has a token when the bootstrap fires

If the input place is an orphan (tokens=0, no incoming arc), the bootstrap call silently fails — the task is not enabled so `assignTask` does nothing.

---

## XML STRUCTURE

```xml
<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:noNamespaceSchemaLocation="https://petriflow.com/petriflow.schema.xsd">
    <id>process_id</id><version>1.0.0</version><initials>ABC</initials>  <!-- EXACTLY 3 uppercase letters — XSD enforces length=3, e.g. "HR" is INVALID, use "HRW" -->
    <title>Process Title</title><icon>assignment</icon>
    <defaultRole>true</defaultRole><anonymousRole>false</anonymousRole><transitionRole>false</transitionRole>
    <!-- caseEvents immediately after metadata, BEFORE roles -->
</document>
```

| Config | defaultRole | anonymousRole |
|--------|-------------|---------------|
| Internal | true | false |
| eForm (public) | true | true |
| System-only | false | false |

---

## PROCESS TYPES

| Type | Description |
|------|-------------|
| 1 — Internal | All logged-in, explicit roles |
| 2 — eForm | Public submission + authenticated back-office; `anonymousRole=true`; public task gets `anonymous` roleRef |
| 3 — Automation | Fully system-driven; `defaultRole=false`; only `system` role |
| 4–6 — Mixed/Hybrid | Combinations of above |

---

## ROLES

```xml
<role><id>manager</id><title>Manager</title></role>
```
- Always `<role>`, never `<processRole>`
- `anonymous` / `default` — built-in, only in `<roleRef>`, **never declared as `<role>`** — declaring them causes an import error
- Declare `system` role if any systematic tasks exist

---

## DATA FIELDS

| Type | Components |
|------|-----------|
| `text` | `textarea`, `richtextarea`, `currency` |
| `number` | `currency` |
| `date` / `dateTime` | — |
| `boolean` | — |
| `enumeration` / `enumeration_map` | `select`(default), `list`, `stepper`, `autocomplete`, `dynamic_autocomplete`, `icon` |
| `multichoice` / `multichoice_map` | `select`(default), `list`, `autocomplete` |
| `file` | `preview` (optional) |
| `fileList` | — (no component) |
| `user` / `userList` | — |
| `taskRef` | `<init>transition_id</init>` for static; target must be on `read` arc |
| `caseRef` | list of case string IDs; `allowedNets` restricts linked processes |
| `i18n` | `divider` |
| `button` | `<init>1</init>` required; `<placeholder>` = label; fires `set` event on click without finishing task |

**Option syntax:** `<option key="k">Display</option>` — never `<option><key>k</key><value>v</value></option>`

**Init:** `<init>text</init>` for text/number/boolean (NOT `<value>`) · `<init>key</init>` for enumeration/taskRef · `<inits><init>k</init></inits>` for multichoice · routing number fields `<init>0</init>` · OR-join `from_X` fields `<init>1</init>`
⚠️ **Never use `<value>` as a child of `<data>` for default values — always use `<init>`**

⚠️ **`<component>` must always contain `<name>` — never use empty `<component/>` or `<component></component>`. XSD requires `<name>` as child element: `<component><name>textarea</name></component>`**

⚠️ **`<data>` element order is strict: `<id>` → `<title>` → `<component>` → `<init>` / `<options>` / `<values>` → `<view>`. Never put `<init>` before `<title>` — XSD will reject it.**

⚠️ **`fileList` fields NEVER use a `preview` component. Only `file` (single upload) may optionally use `preview`. For `fileList`, omit `<component>` entirely.**

**`_map` rule:** always use `enumeration_map` / `multichoice_map` for fields read in Groovy — plain variants store display text as key, so `sel.contains("key")` silently returns false when key ≠ display text.

**`icon` component** — requires `enumeration_map`; option display value must be a Material icon name.

**`button` example:**
```xml
<data type="button">
  <id>add_row</id><title/><placeholder>Add</placeholder><init>1</init>
  <event type="set"><id>add_row_set</id>
    <actions phase="pre"><action id="N"><![CDATA[
      rows: f.rows;
      def c = createCase(workspace + "child")
      def tid = c.tasks.find { it.transition == "t1" }?.task
      assignTask(findTask({ it._id.eq(tid) }))
      change rows value { rows.value + tid }
    ]]></action></actions>
  </event>
</data>
```

**`caseRef` allowedNets — Option A (static XML):**
```xml
<data type="caseRef"><id>children</id><title>Children</title>
    <allowedNets><allowedNet>YOUR_SPACE/child_process</allowedNet></allowedNets>
</data>
```
**Option B (dynamic):**
```groovy
children: f.children, pid: f.pid;
change pid value { workspace + "child_process" }
change children allowedNets { [pid.value] }
```

---

## TRANSITION

**MANDATORY element order inside `<transition>` — XSD enforces this strictly:**

```xml
<transition>
  <id>t_id</id>          <!-- 1. id -->
  <x>208</x><y>208</y>   <!-- 2. x, y -->
  <label>Label</label>   <!-- 3. label -->
  <icon>send</icon>      <!-- 4. icon (optional) -->
  <assignPolicy>auto</assignPolicy>  <!-- 5. assignPolicy -->
  <roleRef>              <!-- 6. roleRef (one or more) -->
    <id>role_id</id>
    <logic><perform>true</perform></logic>
  </roleRef>
  <dataGroup>            <!-- 7. dataGroup (zero or more) -->
    <id>g1</id><cols>2</cols><layout>grid</layout><title>Section</title>
    <dataRef>
      <id>field_id</id>
      <logic><behavior>editable</behavior><behavior>required</behavior></logic>
      <layout><x>0</x><y>0</y><rows>1</rows><cols>1</cols><template>material</template><appearance>outline</appearance></layout>
    </dataRef>
  </dataGroup>
  <event type="finish">  <!-- 8. event (optional, AFTER dataGroup) -->
    <id>ev1</id>
    <actions phase="pre"><action id="1"><![CDATA[ ... ]]></action></actions>
  </event>
  <priority>1</priority> <!-- 9. priority — ALWAYS LAST inside </transition> -->
</transition>
```

**⛔ FORBIDDEN — causes XSD error every time:**
```xml
<!-- WRONG: priority before dataGroup or event -->
<transition>
    <roleRef>...</roleRef>
    <priority>1</priority>   ← ERROR
    <dataGroup>...</dataGroup>
</transition>

        <!-- WRONG: priority before event -->
<transition>
<dataGroup>...</dataGroup>
<priority>1</priority>   ← ERROR
<event type="finish">...</event>
</transition>
```

- Behaviors: `editable` `visible` `required` `optional` `hidden` `forbidden`
- Events are direct children of `<transition>` — no `<transitionEvents>` wrapper
- `<roleRef><logic>`: only `<perform>`, `<cancel>`, `<delegate>` — never `<view>`
- System tasks: `system` roleRef, no dataGroup, fired via `async.run`
- `<priority>1` = shown first in UI; detail/status tasks use higher number (e.g. `2`)
- **`<initials>` must be EXACTLY 3 uppercase letters** — e.g. `ABC`, never `AB` or `ABCD`

---

## PLACES AND ARCS

```xml
<place><id>start</id><x>112</x><y>208</y><label>Start</label><tokens>1</tokens><static>false</static></place>
<place><id>p0</id>  <x>304</x><y>208</y><label>Pending</label><tokens>0</tokens><static>false</static></place>
```

- Exactly **one** `<tokens>1</tokens>` — the start place. All others: `0`.
- All places: `<static>false</static>`
- Strict alternation: **Place → Transition → Place**

| Arc type | Behavior |
|----------|----------|
| `regular` | Consumes token |
| `read` | Non-consuming — persistent/status places |
| `reset` | Removes ALL tokens from source place at once — equivalent to variable arc where multiplicity = current token count. Use when a place can accumulate multiple tokens (e.g. voting counter) and you need to drain it completely before moving on. |
| `inhibitor` | Fires only when source has 0 tokens |
| `regular` + `<reference>` | Variable arc — multiplicity from `number` field at runtime |

**Read arc source checklist — before generating, verify each read-arc source place:**
- Starts with `tokens=1`? → permanently alive ✅
- Has a regular arc FROM an upstream transition INTO it? → will receive token at runtime ✅
- Neither? → **orphan place — silent deadlock**. The transition will never enable. ❌

```
✅ [t_submit] ──regular──► [p_detail:0] ──read──► [status_view]   (p_detail gets token from submit)
✅ [p_list:tokens=1]       ──read──► [t_list]                      (p_list starts with token)
❌ [p1:tokens=0]           ──read──► [approve_invoice]              (nothing puts token in p1 → deadlock)
```

**Variable arc** — no `type="variable"`, always `type="regular"` + `<multiplicity>0</multiplicity>` + `<reference>field_id</reference>`:
```xml
<arc><id>a</id><type>regular</type><sourceId>routing_transition</sourceId>
  <destinationId>after_legal</destinationId><multiplicity>0</multiplicity><reference>toLegal</reference></arc>
```

**Coordinates — MANDATORY on every `<transition>` and `<place>`.**
Every transition and place must have `<x>` and `<y>` as direct children. Without them the builder places all elements at (0,0) — everything stacks on one point and the diagram is unusable.

```xml
<transition><id>t1</id><x>304</x><y>208</y><label>Submit</label>...</transition>
<place><id>p0</id><x>496</x><y>208</y><tokens>0</tokens><static>false</static></place>
```

**Canvas layout rules — think through the sketch before generating:**

**Main flow lane:** Y=208, X starts at 112, increments 192px per element.
```
[start:112,208] → [t_submit:304,208] → [p0:496,208] → [t_review:688,208] → [p1:880,208] → [t_next:1072,208]
```

**Branch lanes:** each parallel branch gets its own Y — upper branch Y=112 (or Y=16 for detail), lower branch Y=304, third branch Y=400. Branches rejoin at a shared merge place back on Y=208.
```
main   Y=208:  [p0] → [t_route] →(ref:toA)→ [p_a:496,112] → [t_a:688,112] → [p_merge:880,208] → [t_final]
upper  Y=112:                                 ↑                               ↑
lower  Y=304:                  →(ref:toB)→ [p_b:496,304] → [t_b:688,304] ───┘
```

**Status / detail task lane:** Y=400 (or Y=16 for always-visible top lane). The place feeding it sits at the same Y, below the main flow.
```
[t_submit:304,208] → [p_detail:496,400] ──read──→ [t_status:688,400]
```

**Reject / loop arc:** token goes back to an earlier place — use `<breakpoint>` tags to route the arc below the main flow so it doesn't overlap. Standard pattern: break down to Y=368 then back across.
```xml
<arc><id>a_loop</id><type>regular</type><sourceId>t_review</sourceId><destinationId>start</destinationId>
    <multiplicity>0</multiplicity><reference>go_reject</reference>
    <breakpoint><x>688</x><y>368</y></breakpoint>
    <breakpoint><x>112</x><y>368</y></breakpoint>
</arc>
```

**Multi-lane summary (quick reference):**
| Lane | Y value | Use |
|------|---------|-----|
| Top detail | 16 | taskRef / always-visible status task |
| Main flow | 208 | primary sequence of tasks and places |
| Upper branch | 112 | first parallel branch |
| Lower branch | 304 | second parallel branch |
| Status / detail | 400 | status view, read-only detail, secondary tasks |
| Third branch | 592 | third parallel branch |
| Loop breakpoint | 368 | reject/revision arc routing below main flow |

**X spacing:** Every `<place>` AND every `<transition>` is a separate element with its own unique X position. Step 128px per element:
```
start(112) → t1(240) → p1(368) → t2(496) → p2(624) → t3(752) → p3(880) → t4(1008) → p4(1136)
```
⚠️ **Never assign the same (x,y) to a place and a transition.** Every element gets its own X slot.

**Y lanes — organise by semantic role, not position:**

Use horizontal lanes to separate concerns. The X axis = time (left→right progress). The Y axis = what the element does:

| Lane | Y | Contents |
|------|---|----------|
| Status / detail | 80 | Read-arc places, status view tasks, sub-form containers |
| **Happy path** | **208** | **Main flow: all transitions and places on the approval path** |
| Loop / reject | 336 | Reject places, resubmit transitions, loop-back arcs |
| Parallel branch | 400 | OR-split branch places and their department tasks |

**Example — order process with review + loop:**
```
Y=80  (status):   [p_status:0] ──read──→ [t_status_view]
Y=208 (happy):    [start:1] → [t_submit] → [p_submitted] → [t_review] → [p_open] → [t_open_sys] → [p_panel:0] → [t_panel]
Y=336 (loop):                  [t_resubmit] ← [p_loop:0]
```
Branching arcs (variable arcs from `t_review` to `p_open` or `p_loop`) go diagonally between lanes — this makes the fork visually obvious.

**Rules:**
- Happy path is always at Y=208, always readable left-to-right without interruption
- Loops and rejects go BELOW (Y=336+) — they are exceptions, not the main story
- Status/detail tasks go ABOVE (Y=80) — they are observers, not participants in the flow
- `tokens=1` permanent places go in the lane of the task they feed (usually Y=336 for permanently open tasks below the main flow)
- Branch places from OR-split go at Y=400 with their department tasks if there are many; at Y=336 if just one reject loop

**No two elements at the same (x,y).** If two elements would share coordinates, offset by 96px.

**Place related elements near each other — do not stretch everything onto one horizontal line.**
The goal is a readable diagram, not mechanical X-increment. Guidelines:
- Places that feed a transition → same X as that transition, offset Y
- Reject/loop places → below the main flow (Y=336 or Y=400), near the transition they come from
- `tokens=1` permanent places → directly below or beside the task they feed via read arc
- Status/detail places → above main flow (Y=80 or Y=16), near the task that creates them

**Example — open order with permanent panel place:**
```
main flow Y=208:  [start] → [submit] → [submitted] → [review] → [reviewed] → [open_sys] → [p_open] → [t_panel]
loop Y=336:                             [p_loop] → [resubmit] ↗
permanent Y=336:                                                                              [p_permanent:1] ↑read
```
Not:
```
❌  [start] → [submit] → [submitted] → [review] → [reviewed] → [open_sys] → [p_open] → [t_panel] → [p_panel] → [p_permanent:1]
    (everything on one line — illegible, p_permanent far from the task it feeds)
```

---

## ACTIONS

| Scope | Placement | Types |
|-------|-----------|-------|
| Case | `<caseEvents>` — after metadata, before roles | `create` `delete` |
| Transition | inside `<transition>` | `assign` `finish` `cancel` `delegate` |
| Data | inside `<dataRef>` or `<data>` | `set` `get` |

**Phases:** `pre` = before event (status, routing flags, validation) · `post` = after event (email, async, API)

**Action structure:**
```groovy
field1: f.field_id1,
field2: f.field_id2,
t_next: t.transition_id;
change field1 value { "New Value" }
make field2, required on t_next when { return field1.value == "x" }
```
- Every field/transition used in body → in import header. `f.field_id` only in header, never in body.
- Action IDs globally unique, sequential across entire document.
- Commas between imports, one semicolon at end.

**`change` vs `setData`:** `change` = synchronous · `setData(task, [...])` = inside `async.run` or cross-case.

**`setData` type strings:** `"text"` · `"number"` · `"boolean"` · `"date"` · `"dateTime"` · `"enumeration"` / `"enumeration_map"` · `"multichoice"` / `"multichoice_map"` · `"user"` · `"taskRef"` · `"caseRef"`

**`make` syntax:**
```groovy
make <field>, <behaviour> on <transition> when { <condition> }
// when { true } / when { false } unconditional; when { return expr } conditional
// optional removes required; make ... on transitions — use sparingly
```

**`async.run`:**
```groovy
async.run {
  def t = findTask { qTask -> qTask.transitionId.eq("id").and(qTask.caseId.eq(useCase.stringId)) }
  if (t) { assignTask(t, userService.loggedOrSystem); finishTask(t, userService.loggedOrSystem) }
}
```
- Always use `async.run` for `assignTask`/`finishTask` inside event actions.
- Exception in one `async.run` block may prevent subsequent blocks — guard with null-checks.

**Date/time — CRITICAL: use `java.time.*`, NOT `java.util.Date`:**

| Field type | Java type | Set current |
|------------|-----------|-------------|
| `date` | `java.time.LocalDate` | `java.time.LocalDate.now()` |
| `dateTime` | `java.time.LocalDateTime` | `java.time.LocalDateTime.now()` |

```groovy
// Date arithmetic
def days = java.time.temporal.ChronoUnit.DAYS.between(
        start.value as java.time.LocalDate, end.value as java.time.LocalDate)
// Business days deadline
def date = request_date.value as java.time.LocalDate
def added = 0
while (added < daysToAdd) {
  date = date.plusDays(1)
  if (date.dayOfWeek != java.time.DayOfWeek.SATURDAY && date.dayOfWeek != java.time.DayOfWeek.SUNDAY) added++
}
change deadline value { date }
```

---

## SERVICES AND OPERATIONS

```groovy
// User
userService.loggedOrSystem.email
userService.loggedOrSystem.transformToUser()

// Case
def c  = findCase  { it._id.eq(id) }
def cs = findCases { it.processIdentifier.eq(workspace + "process_id") }  // ALWAYS workspace + prefix — never a bare string literal
def c  = createCase(workspace + "child_id", "Title", "blue")  // full — workspace + required
def c  = createCase(workspace + "child_id")                   // minimal — workspace + required
def val = c.getFieldValue("field_id")             // alt to c.dataSet["field_id"]?.value

// Check token state of a place on a case — use activePlaces, NOT getPlace() which does not exist
def hasToken = (c.activePlaces?.get("p_open") ?: 0) > 0   // true if p_open has at least 1 token
// Use this to filter cases by workflow state:
def approvedOrders = findCases { it.processIdentifier.eq(workspace + "order_process") }
        .findAll { c -> (c.activePlaces?.get("p_open") ?: 0) > 0 }

// ❌ NEVER use c.getPlace("p_open") — this method does not exist on Case objects and always returns null
workflowService.deleteCase(c.stringId)
changeCaseProperty("title").about { "New Title" }
changeCaseProperty("color").about { "green" }     // red|orange|yellow|green|teal|cyan|blue|indigo|purple|pink|brown|grey

// ⚠️ QUERYDSL LIMITATION — NEVER filter by dataSet field values inside findCases/findTasks query blocks.
// it.dataSet.get("field").value.eq(...) and it.dataSet.get("field").contains(...) do NOT work — throws MissingPropertyException.
// Valid predicates: processIdentifier, title, _id, stringId, caseId, transitionId, author, color, creationDate.
// To filter by field value: load all cases first, then filter in Groovy with findAll:
//
//   ❌ findCases { it.processIdentifier.eq("proc").and(it.dataSet.get("status").value.eq("Done")) }
//   ✅ findCases { it.processIdentifier.eq("proc") }
//          .findAll { c -> c.dataSet?.get("status")?.value == "Done" }

// Task — single
def t  = findTask  { it.transitionId.eq("id").and(it.caseId.eq(useCase.stringId)) }
def ts = findTasks { it.caseId.in(caseRefField.value).and(it.transitionId.eq("t2")) }
def tid = newCase.tasks.find { it.transition == "t1" }?.task  // first task of new case
assignTask("transition_id")                   // assign to current user, same case
assignTask(task)                              // assign task object to current user
assignTask(task, userService.loggedOrSystem)
finishTask("transition_id")
finishTask(task)
cancelTask(taskObj)

// Task — plural (prefer over .each loops — more efficient)
def tasks = findTasks { it.transitionId.eq("review").and(it.caseId.in(caseIds)) }
assignTasks(tasks)                            // assign list to current user
assignTasks(tasks, userService.loggedOrSystem)
finishTasks(tasks)
finishTasks(tasks, userService.loggedOrSystem)
cancelTasks(tasks)
cancelTasks(tasks, userService.loggedOrSystem)

// getData — read all field values from a task (returns Map<String,Field>)
def task = findTask { it.transitionId.eq("edit_limit").and(it.caseId.eq(useCase.stringId)) }
def data = getData(task)
change my_field value { data["remote_field"].value }
// also: getData(transitionObject) or getData("transitionId", caseObject)

// setData
setData(task, [field: [value: "v", type: "text"]])
setData("transition_id", targetCase, ["field": ["value": "v", "type": "text"]])  // cross-case shorthand

// Role
assignRole("role_id", petriNet); removeRole("role_id", petriNet)

// Email / PDF
sendEmail([email.value], "Subject", "Body")
generatePdf("transition_id", "file_field_id")

// Populate options from cases of another process
def opts = findCases { it.processIdentifier.eq(workspace + "order") }
        .collectEntries { [(it.stringId): "Order: " + it.stringId] }
change my_field options { opts }

// Batch finish all tasks in taskRef list (manual loop with null-check)
taskref: f.taskref;
taskref.value.each { id -> def t = findTask({ it._id.eq(id) }); if (t) finishTask(t) }
```

---

## ROUTING SELECTION

| Situation | Use |
|-----------|-----|
| User picks one of N paths via field | Variable arcs (XOR) — set one `number`=1, rest=0 in `phase="pre"` |
| All N branches must complete, one rejection = immediate stop | AND-split/join with variable arcs on review transitions (Pattern 4a) |
| All N branches must complete, collect all feedback then decide | AND-split/join with unconditional arcs to join, system evaluate task (Pattern 4b) |
| User selects 1–N paths via multichoice_map | OR-split via variable arcs (Pattern 6) |
| Decision needs Groovy logic (ranges, lookups) | Systematic tasks (Pattern 14) |
| ❌ NEVER | Two plain regular arcs from same place without `<reference>` |
| ❌ NEVER | Multiple regular arcs from DIFFERENT places into same transition without deliberate AND-join setup — this is an implicit AND-join deadlock |
| One-to-many child processes managed from parent | Pattern 24 |
| Child registers itself into parent | Pattern 25 (child setData push + parent set event) |
| Bulk approve/process N child tasks at once | Pattern 26 |
| One-to-many child processes managed from parent | Pattern 24 |
| Child registers itself into parent | Pattern 25 |
| Bulk approve/process N child tasks at once | Pattern 26 |

⚠️ **IMPLICIT AND-JOIN TRAP** — these look like XOR but act as AND (deadlock):

```
WRONG — “task reachable from either branch”:
  p_normal → assign_sd  (regular)
  p_cr     → assign_sd  (regular)   ← assign_sd needs BOTH simultaneously → DEADLOCK
FIX: merge branches into ONE shared place:
  p_normal → p_merge   p_cr → p_merge   p_merge → assign_sd

WRONG — “task available in multiple states”:
  p2 → add_comment   p4 → add_comment   p5 → add_comment
  (p2/p4/p5 are mutually exclusive → add_comment needs ALL THREE → DEADLOCK)
FIX A (OR-join): from_X variable arcs (Pattern 6)
FIX B: all relevant upstream transitions → p_shared → add_comment
```

```
Simple field → Variable arcs
  XOR (one path)  → one number=1, rest=0 → all branches → shared merge PLACE
  OR-split        → multiple numbers=1
    Fixed 2–3 branches → OR-join via incoming variable arcs (from_X init=1)
    Dynamic N, own tasks → Pattern 6b (pre-load go_count tokens)
    Dynamic N, shared task → counter + systematic task
Complex Groovy logic → Systematic tasks
Persistent submitter view → taskRef (Form task on read arc)
Always-accessible status → Detail task + read arc (Pattern 16)
```

---

## GOTCHAS

| # | Rule |
|---|------|
| 1 | `multichoice_map` not `multichoice`; `enumeration_map` not `enumeration` — when field read in Groovy. For multichoice_map membership test use `"key" in field.value` not `.contains("key")` (value is a Set, not String). |
| 2 | Variable arc source = **Transition**, never Place |
| 3 | Variable arc reference = **`number` field**, never boolean |
| 4 | Routing flags in **`phase="pre"`** — token moves after pre |
| 5 | **One `<dataGroup>`** per transition — builder silently ignores rest |
| 6 | `caseEvents` only `create`/`delete`; placed **after metadata, before roles** |
| 7 | `task` variable only in transition events, not caseEvents |
| 8 | `setData` / `assignTask` / `finishTask` only inside `async.run` |
| 9 | XOR reconvergence → shared merge **PLACE**, not shared transition (= AND-join = deadlock) |
| 10 | AND-join after OR-split = deadlock → use incoming variable arcs (`from_X`, `init=1`) |
| 11 | Empty `<component/>` = silent bug — omit or set `<name>name</name>` |
| 12 | `f.field_id` only in import header, never in body |
| 13 | Arithmetic in CDATA: `*` must be plain ASCII, never `<em>` or `&times;` |
| 14 | Special chars in XML text: `&`→`&amp;` `<`→`&lt;` `>`→`&gt;` |
| 15 | `taskRef` target must be permanently alive — on a `read` arc |
| 16 | System task chains — every system task fires next via `async.run` in finish post |
| 17 | Every decision option needs: number field + variable arc + destination place |
| 18 | Variable arc `(0)` in modeller — expected, not a bug |
| 19 | AND-split needs dedicated **split transition** (system role) — place with two outgoing arcs = race condition |
| 20 | Exactly one `<?xml?>` prolog (or none — builder format has no prolog) |
| 21 | `<dataGroup>` order: `<id>` → `<cols>` → `<layout>grid</layout>` → `<title>` |
| 22 | All field reads in `caseEvents` require import header |
| 23 | Decision inside task → variable arcs from that transition; never two regular arcs from preceding place |
| 24 | Cancel from multiple states → one cancel transition per state |
| 25 | `from_X` OR-join fields: `<init>1</init>` — if `0`, join fires immediately at case creation |
| 26 | Loop revision arc → back to **same input place** as main flow, not new merge place |
| 27 | `assignTask`/`finishTask` only when target transition is enabled (input place has token) |
| 28 | `setData` self-copy is no-op — all tasks in same case share field values |
| 29 | `button` field: `<init>1</init>` required; `<placeholder>` = label; `editable` in dataGroup |
| 30 | `createCase(id)` minimal form valid; get first task via `newCase.tasks.find { it.transition=="t1" }?.task` |
| 31 | `workflowService.deleteCase(stringId)` — deletes case programmatically |
| 32 | `findTasks { it.caseId.in(list) }` — `.in()` filters across multiple case IDs |
| 33 | `case.getFieldValue("id")` — alternative to `case.dataSet["id"]?.value` |
| 34 | **ALWAYS use `workspace + "process_id"` in `findCases`, `findTasks`, and `createCase`** — never a bare string literal for process identifiers. `workspace` is an eTask runtime variable that prefixes all process IDs. Omitting it causes silent lookup failures (no cases found, no tasks found) with no error message. This applies to every cross-process call without exception. |
| 35 | **Empty `<caseEvents>` block causes eTask import error** — if there are no real actions, omit the entire `<caseEvents>` block. A block with only a comment or empty action is invalid. |
| 36 | **Permanently open task: `read` arc ONLY — never also a `regular` arc from the same place.** A task that must never finish needs only a `read` arc from a place with a token. Adding a `regular` arc from the same place makes the task finishable (the token is consumed) and breaks the permanent-open pattern. `read`+`regular` from the same place to the same transition is always wrong — pick one: `read` for permanent tasks, `regular` for tasks that consume the token and finish. |
| 37 | **`taskRef` `<init>` is for static single-task embeds only** — for a dynamic list built via button+createCase, leave `<init>` empty. Set the taskRef value dynamically via `change field value { list + tid }` in the button action. |
| 38 | **`assignTask` in button `phase="pre"` is the one legitimate exception to C3.** When a button creates a child case and you call `assignTask(t1_of_new_case)` in the button's `set` event `phase="pre"`, this is correct — it ensures the child task appears immediately in the parent's `taskRef` panel. This is NOT the same as calling `assignTask` on a human task from a transition event, which is always wrong. |
| 39 | **`workspace` keyword works only for logged-in users.** In any process that can be reached via anonymous view (anonymousRole=true), use the processIdentifier parsing trick instead: `def prefix = useCase.processIdentifier - useCase.processIdentifier.split("/").last()` then `prefix + "child_process"`. Using `workspace` in anonymous context returns a different workspace path and `createCase`/`findCases` silently fails. |
| 40 | **`activePlaces.get("p_id").eq(1)` IS valid in findCases QueryDSL.** Unlike `dataSet` field filters (which throw MissingPropertyException), `activePlaces` predicates work correctly in `findCases` query blocks. Use this to filter cases by their workflow state (which place holds the token). |
| 41 | **Bulk finish: copy the list first, clear taskRef, then finish.** Always: `def ids = taskref.value; change taskref value { [] }; ids.each { finishTask(...) }`. Finishing tasks while iterating over the live taskRef value can cause mutation issues. The clear-before-finish pattern also ensures the UI shows an empty panel immediately. |
| 45 | **Multiple regular arcs INTO the same transition = AND-join = fires only when ALL source places have tokens simultaneously.** If those places are on mutually exclusive branches (token is in exactly one at a time), the transition will NEVER fire — silent deadlock. Two common LLM mistakes: (a) "task reachable from either of two paths" — `p_normal → t_assign` AND `p_cr → t_assign` — Petri net requires BOTH, but only one ever has a token. Fix: route both branches into ONE shared merge place first. (b) "task available in multiple states" — `p2 → add_comment`, `p4 → add_comment`, `p5 → add_comment` where p2/p4/p5 are mutually exclusive — same deadlock. Fix: OR-join via from_X variable arcs (Pattern 6), or a single shared place that receives token from all relevant upstream transitions. |
| 44 | **System task with `<dataGroup>` is valid ONLY as a `taskRef` sub-form container.** Two distinct system task types: **(A) System action task** — fired via `async.run`, moves tokens, NO dataGroup. Example: `t_pre_approve`, `t_reject`. **(B) System sub-form container** — permanently alive on a `read` arc, used as embedded `taskRef` panel. HAS dataGroup (fields users see), system roleRef (not directly executed), referenced via `<inits><init>task_id</init></inits>`. Example: `t15`/`t16`/`t17`/`t19` in the mortgage process. Never call `async.run { assignTask("sub_form") }` on type B. Never add dataGroup to type A. |
| 43 | **Read-arc source place must actually receive a token — orphan read-arc = permanent deadlock.** A `read` arc from place `p_x` to transition `t` means `t` only enables when `p_x` holds a token. If `p_x` has `tokens=0` AND no regular arc leads into it, `t` will never enable. This is a silent deadlock — no error message, the task simply never appears. Always ask: "what arc puts a token into this read-arc source?" If the answer is nothing — either add the incoming arc, set `tokens=1` (for permanently alive places), or remove the read arc entirely. |
| 42 | **Child self-registration via setData + set event on parent.** When child pushes its ID to a parent text field via `setData("t_receiver", parentCase, ["receiver_field": ...])`, the parent's `set` event on that field fires and can add the child to `caseRef`/`taskRef`. This is event-driven IPC — no polling, no repeated findCases. The receiver field must be in an always-alive task (`read` arc). |

---

## CHECKLIST

| Category | Items |
|----------|-------|
| **Roles and fields** | All roles `<role>`; `system` declared if needed; `anonymous`/`default` only in roleRef; selection fields have `<options>`; `_map` variants for Groovy reads; no empty `<component/>`; `taskRef` target on `read` arc |
| **IDs and refs** | All IDs unique lowercase_underscore; every `<dataRef>` matches `<data>`; every `<roleRef>` matches `<role>` or built-in; all arc sourceId/destinationId exist |
| **Actions** | IDs globally unique sequential; all code in CDATA; every field/transition in body → in header; no `f.field_id` in body; commas + one semicolon; `setData`/`assignTask`/`finishTask` in `async.run`; no `task` in caseEvents; one field+one transition per `make`; routing flags `phase="pre"`; no HTML in CDATA; `make when` uses `return` for conditions |
| **caseEvents** | Only `create`/`delete`; placed after metadata, before roles |
| **XML** | Order: metadata→caseEvents→roles→data→transitions→places→arcs; `<dataGroup>` sequence correct; special chars escaped; Y=208 main lane, branches distinct Y, X+192; no duplicate (x,y); one `tokens=1`; P→T→P arcs; all places `<static>false</static>` |
| **Design** | Token trace: no stuck states/race conditions; XOR → merge PLACE; no AND-join after OR-split; every option has branch; `from_X` init=1; var arc source=Transition; var arc ref=number; system tasks bootstrapped; AND-split uses split transition; loop arc → same place as main flow; detail view: ONE dedicated `p_detail` place receives token from ONE regular arc (submit→p_detail), ONE read arc connects p_detail→detail_task — NEVER multiple read arcs from different places on same task, NEVER additional regular arcs into p_detail from other transitions |
| **IPC** | Each process is a fully independent `<document>`; cross-process interaction via action code only; `workspace + "id"` always used in findCases/createCase; child receiver task on read arc (always alive); bulk finish: copy list → clear field → finish; `activePlaces` filter OK in QueryDSL, `dataSet` filter NOT OK; `assignTask` in button phase=pre is the one valid exception for child tasks |

---

## OUTPUT AND TESTING

1. https://builder.netgrif.cloud/modeler — drag and drop XML
2. https://etask.netgrif.cloud/ — test full functionality

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid namespace" | Wrong xmlns | Use exact namespace |
| "Duplicate ID" | Shared ID | Make all IDs unique |
| "No start place" | No tokens=1 | Exactly one start place |
| "Not a number. Cannot change arc weight" | `<reference>` on boolean | Change to number, use 1/0 |
| Variable arc P→P error | sourceId is a Place | Move source to routing transition |
| `sel.contains()` always false | plain multichoice/enumeration | Use `_map` variant |
| OR-split deadlock | AND-join place after OR-split | Incoming variable arcs on join |
| Parallel review race | Place with two outgoing arcs | Dedicated split transition |
| Time trigger never fires | Not system-role transition | Assign `system` role, remove dataGroup |
| `taskRef` panel blank | Referenced task dead | Point only at tasks on `read` arc |
| eTask arithmetic error | `*` as `<em>` | Plain ASCII `*` in CDATA |

---

# PATTERNS

## Pattern 1 — Simple Sequence

```
[start:1] → [submit] → [p0:0] → [review] → [p1:0] → [approve] → [done:0]
```

```xml
<place><id>start</id><x>112</x><y>208</y><label>Start</label><tokens>1</tokens><static>false</static></place>
<place><id>p0</id>  <x>304</x><y>208</y><label>Pending</label><tokens>0</tokens><static>false</static></place>
<place><id>p1</id>  <x>688</x><y>208</y><label>Reviewed</label><tokens>0</tokens><static>false</static></place>
<place><id>done</id><x>1072</x><y>208</y><label>Done</label>  <tokens>0</tokens><static>false</static></place>
<arc><id>a1</id><type>regular</type><sourceId>start</sourceId> <destinationId>submit</destinationId> <multiplicity>1</multiplicity></arc>
<arc><id>a2</id><type>regular</type><sourceId>submit</sourceId><destinationId>p0</destinationId>     <multiplicity>1</multiplicity></arc>
<arc><id>a3</id><type>regular</type><sourceId>p0</sourceId>    <destinationId>review</destinationId> <multiplicity>1</multiplicity></arc>
<arc><id>a4</id><type>regular</type><sourceId>review</sourceId><destinationId>p1</destinationId>     <multiplicity>1</multiplicity></arc>
<arc><id>a5</id><type>regular</type><sourceId>p1</sourceId>    <destinationId>approve</destinationId><multiplicity>1</multiplicity></arc>
<arc><id>a6</id><type>regular</type><sourceId>approve</sourceId><destinationId>done</destinationId>  <multiplicity>1</multiplicity></arc>
```

---

## Pattern 2 — Approval with Rejection (single decision task + variable arcs)

> ✅ One task with decision field + variable arcs. ❌ Never two separate Approve/Reject tasks competing for same place token.

```
                  ┌─(ref:go_approve)→ [approved:0]
[p0:0] → [review] ┤
                  └─(ref:go_reject)→  [rejected:0]
```

```xml
<data type="number"><id>go_approve</id><title>Go Approve</title><init>0</init></data>
<data type="number"><id>go_reject</id><title>Go Reject</title><init>0</init></data>
<data type="enumeration_map"><id>decision</id><title>Decision</title>
<options><option key="approve">Approve</option><option key="reject">Reject</option></options>
</data>
<place><id>approved</id><x>880</x><y>112</y><label>Approved</label><tokens>0</tokens><static>false</static></place>
<place><id>rejected</id><x>880</x><y>304</y><label>Rejected</label><tokens>0</tokens><static>false</static></place>
<arc><id>a_app</id><type>regular</type><sourceId>review</sourceId><destinationId>approved</destinationId><multiplicity>0</multiplicity><reference>go_approve</reference></arc>
<arc><id>a_rej</id><type>regular</type><sourceId>review</sourceId><destinationId>rejected</destinationId><multiplicity>0</multiplicity><reference>go_reject</reference></arc>
```

```groovy
// review finish PRE
go_approve: f.go_approve, go_reject: f.go_reject, decision: f.decision;
if (decision.value == "approve") { change go_approve value { 1 }; change go_reject value { 0 } }
else                              { change go_approve value { 0 }; change go_reject value { 1 } }
```

**Dynamic field reveal on decision change (`event type="set"` on decision dataRef):**
```xml
<dataRef>
    <id>decision</id>
    <logic><behavior>editable</behavior><behavior>required</behavior></logic>
    <layout>...</layout>
    <event type="set"><id>decision_set</id>
        <actions phase="post"><action id="N"><![CDATA[
      t_review: t.review, rejection_reason: f.rejection_reason, decision: f.decision;
      if (decision.value == "reject") { make rejection_reason, editable on t_review when { true } }
      else                            { make rejection_reason, hidden   on t_review when { true } }
    ]]></action></actions>
    </event>
</dataRef>
```

---

## Pattern 3 — OR-split routing: three input variants

Same network structure, three ways to drive the routing decision.
All use the same variable arc pattern: `go_X` number fields, OR-join via matching `from_X` arcs.

**Network structure (identical for all three variants):**
```
                    ┌─(ref:go_legal)──→ [p_legal:0]  → [t_legal]  → [p_out_legal:0]  ─(ref:go_legal)──┐
[p2:0] → [t_route] ┼─(ref:go_technical)→ [p_tech:0]  → [t_tech]   → [p_out_tech:0]   ─(ref:go_technical)┼→ [t_final]
                    └─(ref:go_business)→ [p_biz:0]   → [t_biz]    → [p_out_biz:0]    ─(ref:go_business)─┘
                    └─────────────────→ [p_always:0] ───────────────────────────────── regular ──────────┘
```
> The `p_always` place + regular arc ensures `t_final` always gets at least 1 token even if no branch was selected.
> `go_X` fields: `<init>0</init>` for split arcs; OR-join arcs also use `go_X` as reference (no separate `from_X` needed when using the same field for both split and join).

---

### Variant A — Boolean sliders (one per department)

Use when: user independently toggles each department on/off.

```xml
<data type="boolean"><id>decision_legal</id><title>Legal</title></data>
<data type="boolean"><id>decision_technical</id><title>Technical</title></data>
<data type="boolean"><id>decision_business</id><title>Business</title></data>
<data type="number"><id>go_legal</id><title/><init>0</init></data>
<data type="number"><id>go_technical</id><title/><init>0</init></data>
<data type="number"><id>go_business</id><title/><init>0</init></data>
```

```groovy
// Process function — reused for each boolean slider's set event
{ department_slider, arc_multiplicity ->
    if (department_slider.value == true) { change arc_multiplicity value { 1 } }
    else                                 { change arc_multiplicity value { 0 } }
}

// Each boolean slider's set event calls the function:
// decision_legal set event:
go_legal: f.go_legal, decision_legal: f.decision_legal;
set_arc(decision_legal, go_legal)
```

---

### Variant B — Enumeration_map (XOR: exactly one department)

Use when: user picks exactly one department from a dropdown.

```xml
<data type="enumeration_map"><id>department</id><title>Department</title>
    <options>
        <option key="legal">Legal</option>
        <option key="technical">Technical</option>
        <option key="business">Business</option>
    </options>
</data>
```

```groovy
// Process function — sets one arc to 1, others to 0
{ arc_true, arc_false1, arc_false2 ->
    change arc_true  value { 1 }
    change arc_false1 value { 0 }
    change arc_false2 value { 0 }
}

// t_route finish PRE
go_legal: f.go_legal, go_technical: f.go_technical, go_business: f.go_business,
department: f.department;
if (department.value == "legal")     { decision(go_legal,     go_technical, go_business) }
if (department.value == "technical") { decision(go_technical, go_legal,     go_business) }
if (department.value == "business")  { decision(go_business,  go_legal,     go_technical) }
```

---

### Variant C — Multichoice_map (OR: one or more departments)

Use when: user can select multiple departments simultaneously.

```xml
<data type="multichoice_map"><id>departments</id><title>Departments</title>
    <options>
        <option key="legal">Legal</option>
        <option key="technical">Technical</option>
        <option key="business">Business</option>
    </options>
</data>
```

```groovy
// t_route finish PRE — "key" in field.value syntax for multichoice_map
go_legal: f.go_legal, go_technical: f.go_technical, go_business: f.go_business,
departments: f.departments;
if ("legal"     in departments.value) { change go_legal     value { 1 } } else { change go_legal     value { 0 } }
if ("technical" in departments.value) { change go_technical value { 1 } } else { change go_technical value { 0 } }
if ("business"  in departments.value) { change go_business  value { 1 } } else { change go_business  value { 0 } }
```

> ⚠️ **`"key" in field.value`** — correct syntax for multichoice_map membership test.
> Never use `.contains("key")` on multichoice_map — it returns false because the value is a Set/List, not a String.
> Never use plain `multichoice` — use `multichoice_map` so keys are stored (not display text).

---

**Which variant to choose:**

| Situation | Variant |
|-----------|---------|
| Exactly ONE department (exclusive choice) | B — enumeration_map + decision() function |
| ONE OR MORE departments (inclusive choice) | C — multichoice_map + `"key" in value` |
| Each department toggled independently (boolean flags) | A — boolean fields + set_arc() function |

---

## Pattern 4 — AND-split / AND-join (parallel branches)

```
                   ┌→ [legal_p:0] → [review_legal] ──────────────────┐
[p0:0] → [split,sys] ┤                                                  [join:0] →(mult=2)→ [finalize]
                   └→ [finance_p:0]→[review_finance]─────────────────┘
```

> ⚠️ Place with two outgoing arcs = race condition, not AND-split. Split is a system task.
> ⚠️ **No intermediate "done" places between the review transitions and the join place.** Route each review transition directly into `join` — inserting `legal_done → join` creates a Place→Place arc which is invalid (C2).

```xml
<transition><id>split</id><x>304</x><y>208</y><label>Split</label>
    <roleRef><id>system</id><logic><perform>true</perform></logic></roleRef>
</transition>
<place><id>legal_p</id>  <x>496</x><y>112</y><label>Legal Queue</label>   <tokens>0</tokens><static>false</static></place>
<place><id>finance_p</id><x>496</x><y>304</y><label>Finance Queue</label> <tokens>0</tokens><static>false</static></place>
<place><id>join</id>     <x>880</x><y>208</y><label>Both Done</label>     <tokens>0</tokens><static>false</static></place>
<arc><id>a1</id><type>regular</type><sourceId>p0</sourceId>            <destinationId>split</destinationId>         <multiplicity>1</multiplicity></arc>
<arc><id>a2</id><type>regular</type><sourceId>split</sourceId>         <destinationId>legal_p</destinationId>       <multiplicity>1</multiplicity></arc>
<arc><id>a3</id><type>regular</type><sourceId>split</sourceId>         <destinationId>finance_p</destinationId>     <multiplicity>1</multiplicity></arc>
<arc><id>a4</id><type>regular</type><sourceId>legal_p</sourceId>       <destinationId>review_legal</destinationId>  <multiplicity>1</multiplicity></arc>
<arc><id>a5</id><type>regular</type><sourceId>finance_p</sourceId>     <destinationId>review_finance</destinationId><multiplicity>1</multiplicity></arc>
<arc><id>a6</id><type>regular</type><sourceId>review_legal</sourceId>  <destinationId>join</destinationId>          <multiplicity>1</multiplicity></arc>
<arc><id>a7</id><type>regular</type><sourceId>review_finance</sourceId><destinationId>join</destinationId>          <multiplicity>1</multiplicity></arc>
<arc><id>a8</id><type>regular</type><sourceId>join</sourceId>          <destinationId>finalize</destinationId>      <multiplicity>2</multiplicity></arc>
```

```groovy
// preceding task finish POST
async.run { assignTask("split"); finishTask("split") }
```

**If a system task follows the AND-join** (e.g. `router_sys` after `join` with multiplicity=2), it also needs bootstrapping — but you don't know which branch finishes last. Solution: **both** review transitions call the bootstrap in their `finish post`. The first call fails silently (only 1 token in `join`, task not yet enabled). The second call fires when `join` has 2 tokens and the task is enabled.

```groovy
// In BOTH review_legal AND review_finance — finish POST:
async.run { assignTask("router_sys"); finishTask("router_sys") }
```

> ⚠️ Never bootstrap only one branch — if that branch finishes first, the call fails and the router never fires. Always add the bootstrap to every branch that feeds the AND-join.

---

## Pattern 4a — AND-split with approve/reject in each branch

```
[review_legal]  ─(ref:legal_approve)→ [join:0] →(mult=2)→ [final]
                └(ref:legal_reject)→  [rejected:0]
[review_finance]─(ref:fin_approve)→   [join:0]
                └(ref:fin_reject)→    [rejected:0]
```

Each review transition routes directly into the shared `join` place (approve) or `rejected` place (reject) — **no intermediate `legal_done`/`finance_done` places**. Those would create Place→Place arcs (C2 violation). Apply Pattern 2 routing action to each review transition independently:

```xml
<data type="number"><id>legal_approve</id><title>Legal Approve</title><init>0</init></data>
<data type="number"><id>legal_reject</id><title>Legal Reject</title><init>0</init></data>
        <!-- same for fin_approve, fin_reject -->
<arc><id>arc_la</id><type>regular</type><sourceId>review_legal</sourceId>  <destinationId>join</destinationId>    <multiplicity>0</multiplicity><reference>legal_approve</reference></arc>
<arc><id>arc_lr</id><type>regular</type><sourceId>review_legal</sourceId>  <destinationId>rejected</destinationId><multiplicity>0</multiplicity><reference>legal_reject</reference></arc>
<arc><id>arc_fa</id><type>regular</type><sourceId>review_finance</sourceId><destinationId>join</destinationId>    <multiplicity>0</multiplicity><reference>fin_approve</reference></arc>
<arc><id>arc_fr</id><type>regular</type><sourceId>review_finance</sourceId><destinationId>rejected</destinationId><multiplicity>0</multiplicity><reference>fin_reject</reference></arc>
<arc><id>arc_j</id><type>regular</type><sourceId>join</sourceId>           <destinationId>finalize</destinationId><multiplicity>2</multiplicity></arc>
```

> ⚠️ If either branch rejects, its token goes to `rejected` — the other branch token gets stuck in `join`. Expected: rejection terminates immediately.
> ⚠️ If a system task follows `join` (multiplicity=2), add `async.run { assignTask("router_sys"); finishTask("router_sys") }` to the `finish post` of **both** `review_legal` and `review_finance`. The first call fails silently; the second fires when both tokens are present.

---

## Pattern 4b — AND-split where BOTH branches must complete before routing (wait-for-all)

Use this when you want to collect feedback from all reviewers before deciding — even if one rejects, the other must still finish. This is the correct pattern when the requirement says "both reviews must be completed before the process can continue."

```
[review_legal]  ──────────────────────────────────────┐
                                                        [p_join:0] →(mult=2)→ [t_evaluate,sys] → p_approved / p_rejected
[review_finance]──────────────────────────────────────┘
```

**Key rule: NO variable arcs on review transitions.** Both always send a regular token to `p_join` regardless of decision. The decision (approve/reject) is stored in data fields and read by `t_evaluate` after both tokens arrive.

```xml
<!-- Both review transitions send unconditional token to p_join -->
<arc><id>arc_la</id><type>regular</type><sourceId>review_legal</sourceId>  <destinationId>p_join</destinationId><multiplicity>1</multiplicity></arc>
<arc><id>arc_fa</id><type>regular</type><sourceId>review_finance</sourceId><destinationId>p_join</destinationId><multiplicity>1</multiplicity></arc>
<arc><id>arc_j</id> <type>regular</type><sourceId>p_join</sourceId>        <destinationId>t_evaluate</destinationId><multiplicity>2</multiplicity></arc>
```

```groovy
// t_evaluate finish PRE — reads decisions from dataSet after both tokens arrive
legal_decision: f.legal_decision, finance_decision: f.finance_decision,
go_approved: f.go_approved, go_rejected: f.go_rejected, status: f.status;
def bothApproved = (legal_decision.value == "approve" && finance_decision.value == "approve")
if (bothApproved) {
    change go_approved value { 1 }; change go_rejected value { 0 }
    change status value { "Pending Final Decision" }
} else {
    change go_approved value { 0 }; change go_rejected value { 1 }
    change status value { "Rejected — Revision Required" }
}

// Bootstrap in BOTH review_legal AND review_finance finish POST:
async.run {
    def t = findTask { it.transitionId.eq("t_evaluate").and(it.caseId.eq(useCase.stringId)) }
    if (t) { assignTask(t, userService.loggedOrSystem); finishTask(t, userService.loggedOrSystem) }
}
```

> ⚠️ **Never use variable arcs on review transitions in this pattern.** If `review_legal` sends token to `p_join` only on approve (variable arc), a rejection produces no token — `p_join` never reaches multiplicity=2 and `t_evaluate` never fires. Both transitions must always send exactly 1 regular token to `p_join`.
> ⚠️ Use Pattern 4a instead if one rejection should terminate immediately without waiting for the other branch.

---

## Pattern 5 — XOR-split / XOR-merge (exclusive choice)

```
              ┌─(ref:toA)→ [path_a:0] → [task_a] ─┐
[p0:0] → [router] ┤                                   [merge:0] → [finalize]
              └─(ref:toB)→ [path_b:0] → [task_b] ─┘
```

> ⚠️ Both branches converge into a shared merge **PLACE** — not directly into a shared transition (= AND-join = deadlock).

```xml
<data type="number"><id>toA</id><title>To A</title><init>0</init></data>
<data type="number"><id>toB</id><title>To B</title><init>0</init></data>
<arc><id>arc_a</id>  <type>regular</type><sourceId>router</sourceId><destinationId>path_a</destinationId><multiplicity>0</multiplicity><reference>toA</reference></arc>
<arc><id>arc_b</id>  <type>regular</type><sourceId>router</sourceId><destinationId>path_b</destinationId><multiplicity>0</multiplicity><reference>toB</reference></arc>
<arc><id>arc_am</id> <type>regular</type><sourceId>task_a</sourceId><destinationId>merge</destinationId> <multiplicity>1</multiplicity></arc>
<arc><id>arc_bm</id> <type>regular</type><sourceId>task_b</sourceId><destinationId>merge</destinationId> <multiplicity>1</multiplicity></arc>
<arc><id>arc_mf</id> <type>regular</type><sourceId>merge</sourceId> <destinationId>finalize</destinationId><multiplicity>1</multiplicity></arc>
```

```groovy
// router finish PRE
toA: f.toA, toB: f.toB, decision: f.decision;
if (decision.value == "path_a") { change toA value { 1 }; change toB value { 0 } }
else                             { change toA value { 0 }; change toB value { 1 } }
```

---

## Pattern 6 — OR-split / OR-join via incoming variable arcs (2–3 fixed branches)

```
              ┌─(ref:to_legal)→  [p_legal_in:0] → [legal_task] → [p_legal_out:0] ─┐
[t_register] ─┤                                                                       [t_final]
              └─(ref:to_finance)→[p_finance_in:0]→[finance_task]→[p_finance_out:0]─┘
```

> ❌ Never AND-join place after OR-split — deadlocks when user selects only one branch.
> ✅ Incoming variable arcs on join; mirror `to_X` as `from_X` with `<init>1</init>`.

```xml
<data type="number"><id>to_legal</id>   <title>To Legal</title>   <init>0</init></data>
<data type="number"><id>to_finance</id> <title>To Finance</title> <init>0</init></data>
<data type="number"><id>from_legal</id>   <title>From Legal</title>   <init>1</init></data>
<data type="number"><id>from_finance</id> <title>From Finance</title> <init>1</init></data>
<data type="multichoice_map"><id>departments</id><title>Departments</title>
<options><option key="legal">Legal</option><option key="finance">Finance</option></options>
</data>
        <!-- OR-split arcs -->
<arc><id>a_vl</id><type>regular</type><sourceId>t_register</sourceId><destinationId>p_legal_in</destinationId>  <multiplicity>0</multiplicity><reference>to_legal</reference></arc>
<arc><id>a_vf</id><type>regular</type><sourceId>t_register</sourceId><destinationId>p_finance_in</destinationId><multiplicity>0</multiplicity><reference>to_finance</reference></arc>
        <!-- OR-join incoming variable arcs -->
<arc><id>a_jl</id><type>regular</type><sourceId>p_legal_out</sourceId>  <destinationId>t_final</destinationId><multiplicity>1</multiplicity><reference>from_legal</reference></arc>
<arc><id>a_jf</id><type>regular</type><sourceId>p_finance_out</sourceId><destinationId>t_final</destinationId><multiplicity>1</multiplicity><reference>from_finance</reference></arc>
```

```groovy
// t_register finish PRE — set BOTH split and join fields together
to_legal: f.to_legal, to_finance: f.to_finance, from_legal: f.from_legal, from_finance: f.from_finance, departments: f.departments;
def sel = departments.value as Set
def gl = sel.contains("legal") ? 1 : 0; def gf = sel.contains("finance") ? 1 : 0
change to_legal value { gl as Double }; change to_finance value { gf as Double }
change from_legal value { gl as Double }; change from_finance value { gf as Double }
```

---

## Pattern 6b — OR-split with per-department tasks and dynamic join (go_count)

Use when N branches is dynamic. Pre-load `go_count` tokens into merge place; each branch deposits 1 back; variable arc on join consumes `go_count`.

```xml
<data type="number"><id>go_count</id><title>Branch Count</title><init>0</init></data>
<data type="number"><id>to_a</id><title>To A</title><init>0</init></data>
        <!-- OR-split + pre-load -->
<arc><id>a_ta</id>   <type>regular</type><sourceId>t_register</sourceId><destinationId>p_a</destinationId>    <multiplicity>0</multiplicity><reference>to_a</reference></arc>
<arc><id>a_pre</id>  <type>regular</type><sourceId>t_register</sourceId><destinationId>p_merge</destinationId><multiplicity>0</multiplicity><reference>go_count</reference></arc>
        <!-- Each branch task → merge -->
<arc><id>a_am</id>   <type>regular</type><sourceId>task_a</sourceId>   <destinationId>p_merge</destinationId><multiplicity>1</multiplicity></arc>
        <!-- join -->
<arc><id>a_mf</id>   <type>regular</type><sourceId>p_merge</sourceId>  <destinationId>t_final</destinationId><multiplicity>0</multiplicity><reference>go_count</reference></arc>
```

```groovy
// t_register finish PRE
go_count: f.go_count, to_a: f.to_a, departments: f.departments;
def sel = departments.value as Set
def aGo = sel.contains("dept_a") ? 1 : 0
change to_a value { aGo as Double }
change go_count value { sel.size() as Double }
```

---

## Pattern 7 — Loop / Revision

```
[start:1] → [submit] → [p0:0] → [review] ─(ref:go_approve)→ [approved:0]
                ↑                          └(ref:go_remake)→  [start] (loop back)
```

Loop arc back to `start` with breakpoints:
```xml
<arc><id>a_loop</id><type>regular</type><sourceId>review</sourceId><destinationId>start</destinationId>
    <multiplicity>0</multiplicity><reference>go_remake</reference>
    <breakpoint><x>432</x><y>368</y></breakpoint><breakpoint><x>112</x><y>368</y></breakpoint>
</arc>
```

> ⚠️ Loop arc returns to the **same place** as the main flow — a place with two incoming regular arcs fires when **any one** arrives (OR semantics, not AND). Do NOT create a new merge place or give the shared task two input places (= AND-join = deadlock).

---

## Pattern 8 — Time Trigger (SLA enforcement)

```
[p_pending:0] → [t_review, reviewer]     (human — consumes token when assigned)
              → [t_sla_check, system, PT24H] (auto-fires after 24h if token still there)
```

```xml
<transition><id>t_sla_check</id><x>496</x><y>400</y><label>SLA Check</label>
    <roleRef><id>system</id><logic><perform>true</perform></logic></roleRef>
    <trigger type="time"><delay>PT24H</delay></trigger>
</transition>
```

Durations: `PT5S` · `PT30M` · `PT2H` · `PT24H` · `P1D` · `P7D`

> ⚠️ Time triggers only on **system-role** transitions. Human task consuming the token automatically disables the timer.

```groovy
// t_sla_check finish PRE
go_reviewed: f.go_reviewed, go_escalated: f.go_escalated, status: f.status;
if ((go_reviewed.value as Integer) == 0) {
    change go_escalated value { 1 }; change status value { "SLA breached" }
    changeCaseProperty("color").about { "red" }
}
// t_review finish PRE
go_reviewed: f.go_reviewed, status: f.status;
change go_reviewed value { 1 }; change status value { "Reviewed within SLA" }
```

---

## Pattern 9 — Parallel Race (first completion wins)

```
              ┌→ [p_a:0] → [review_a] ─(ref:go_final)→ [p_merge:0] → [t_final]
[split] ──────┤                        └(ref:go_dead)→  [p_dead:0]
              └→ [p_b:0] → [review_b] ─(ref:go_final)→ [p_merge:0]
                                       └(ref:go_dead)→  [p_dead:0]
```

```groovy
// each reviewer finish PRE
first_done: f.first_done, go_final: f.go_final, go_dead: f.go_dead;
def flag = (first_done.value as Integer) ?: 0
if (flag == 0) { change first_done value { 1 }; change go_final value { 1 }; change go_dead value { 0 } }
else           { change go_final value { 0 }; change go_dead value { 1 } }
```

`p_dead` has no outgoing arcs — tokens arriving there are permanently absorbed.

---

## Pattern 10 — Voting / Consensus (N of M)

```groovy
// each reviewer finish POST
vote_count: f.vote_count;
def current = (vote_count.value as Integer) ?: 0
change vote_count value { (current + 1) as Double }
if (current + 1 >= 2) {
    findTasks { it.caseId.eq(useCase.stringId).and(it.transitionId.in(["review_a","review_b","review_c"])) }
            .each { t -> cancelTask(t) }
}
```

Join arc uses `<multiplicity>2</multiplicity>` (static quorum). For **dynamic quorum** — store count in `number` field + use as variable arc `<reference>` on join arc.

---

## Pattern 11 — Four-Eyes Principle

```groovy
// first_approval finish POST
first_approver: f.first_approver;
change first_approver value { userService.loggedOrSystem.email }
// second_approval assign PRE
first_approver: f.first_approver;
if (userService.loggedOrSystem.email == first_approver.value)
    throw new java.lang.IllegalStateException("Second approver must be different.")
```

---

## Pattern 14 — Systematic Tasks (code-driven routing)

Both system tasks share `p0` — only the one fired by action consumes the token.

```xml
<transition><id>route_to_legal</id><x>496</x><y>112</y><label>To Legal</label>
    <roleRef><id>system</id><logic><perform>true</perform></logic></roleRef></transition>
<transition><id>route_to_pr</id><x>496</x><y>304</y><label>To PR</label>
<roleRef><id>system</id><logic><perform>true</perform></logic></roleRef></transition>
```

```groovy
// preceding task finish POST
amount: f.amount;
if ((amount.value as Double) < 2000) { async.run { assignTask("route_to_legal"); finishTask("route_to_legal") } }
else                                  { async.run { assignTask("route_to_pr");    finishTask("route_to_pr") } }
// system task chain — each fires next:
async.run {
    def t = findTask { it.transitionId.eq("next_sys_task").and(it.caseId.eq(useCase.stringId)) }
    if (t) { assignTask(t, userService.loggedOrSystem); finishTask(t, userService.loggedOrSystem) }
}
```

---

## Pattern 16 — Persistent Detail View (read arc)

```
[submit] → [p_detail:0] ─(read)→ [detail_view]   (token not consumed, always enabled)
```

```xml
<place><id>p_detail</id><x>304</x><y>16</y><label>Detail</label><tokens>0</tokens><static>false</static></place>
<arc><id>arc_sd</id><type>regular</type><sourceId>submit</sourceId>  <destinationId>p_detail</destinationId>   <multiplicity>1</multiplicity></arc>
<arc><id>arc_dr</id><type>read</type>   <sourceId>p_detail</sourceId><destinationId>detail_view</destinationId><multiplicity>1</multiplicity></arc>
```

> ⚠️ **ONE dedicated place, ONE read arc — never multiple read arcs from different places.**
> A task with read arcs from multiple places (`p_legal`, `p_finance`, `p_join`, ...) is only enabled when ALL those places simultaneously have a token — which never happens in a sequential flow. The task will never appear.
> ✅ Correct: one `p_detail` place that receives a token on submit and keeps it forever. The single read arc from `p_detail` keeps the task permanently enabled regardless of where the main flow token is.
> ❌ Wrong: `p_split ─read→ status_view`, `p_legal ─read→ status_view`, `p_finance ─read→ status_view` — this requires all three places to have tokens simultaneously.

Status updates in `phase="pre"` so detail view reflects new state atomically. Reveal fields progressively:
```groovy
// later task finish PRE
t_detail: t.detail_view, result_field: f.result_field;
make result_field, visible on t_detail when { true }
```

---

## Pattern 16b — Permanently Open Task (never finishes)

Use when a task must stay open indefinitely — a dynamic list, a dashboard, or any task that aggregates items from other processes via a button.

```
[p_list:1] ─(read)→ [t_list]    NO outgoing arc — task can never finish
```

```xml
<place><id>p_list</id><x>112</x><y>208</y><label>List</label><tokens>1</tokens><static>false</static></place>
<arc><id>arc_read</id><type>read</type><sourceId>p_list</sourceId><destinationId>t_list</destinationId><multiplicity>1</multiplicity></arc>
        <!-- NO outgoing arc from t_list -->
```

> ⚠️ **Never pair a regular arc with a read arc on a permanently open task.**
> `start(tokens=1) ──regular──→ t_list ──regular──→ p_list ──read──→ t_list` makes the task finishable — once fired, the token leaves `start` and the task behaviour changes. A permanently open task must have **only** a read arc from a place that permanently holds `tokens=1`.

**“Open after approval” pattern — correct way to become permanently open after a flow step:**

When a task should become permanently open AFTER approval (e.g. “open order” after manager approval), do NOT give it both a regular flow arc AND a read arc from the same place — that is a circular token loop (gotcha #36). Use two separate transitions:

```
[p_reviewed:0] ──regular──► [t_open_sys, system] ──regular──► [p_open:0] ──read──► [t_open_order, submitter]
                                                                                      (permanently open human task)
```

```groovy
// review_order finish POST — bootstrap the system transition that deposits the token
async.run { assignTask("t_open_sys"); finishTask("t_open_sys") }
```

❌ **Wrong — circular token loop:**
```
[p_reviewed] ──regular──► [t_open_order] ──regular──► [p_open] ──read──► [t_open_order]
```
`t_open_order` consumes upstream token, deposits it in `p_open`, read arc keeps it enabled. Looks like permanently open but mixes flow and permanent patterns — the validator flags this.

**Button + createCase on a permanently open task:**
```groovy
// button set PRE
item_tasks: f.item_tasks;
def c   = createCase("item_process", "New Item", "blue", userService.loggedOrSystem)
def tid = c.tasks.find { it.transition == "t_item_form" }?.task
change item_tasks value { (item_tasks.value ?: []) + tid }
```

- `c.tasks.find { it.transition == "t_item_form" }?.task` — gets task string ID directly, no `findTask` query needed
- Do NOT call `assignTask`/`finishTask` on the item task — adding its ID to taskRef is enough to embed it
- The item process task must use `system` role so it can be embedded without human role assignment
- **`taskRef` `<init>` is for static single-task embeds only** — for a dynamic list, leave `<init>` empty and manage the list via `change item_tasks value { ... }` in the button action

---


---

## Pattern 18 — Progressive Field Reveal (make behavior in status task)

Use when a status task should progressively show more data as process stages complete.
Fields start `hidden`, become `visible` as each upstream task finishes.

```groovy
// In each stage finish PRE — reveal relevant fields on the status task
t_status: t.t_status_info, field_to_show: f.field_to_show;
make field_to_show, visible on t_status when { true }
```

> ⚠️ If the SAME `taskRef` variable is used both as a sub-form on a task AND as target in a `make` action, conflicts can occur. Use TWO separate `taskRef` fields pointing to the same task: one for the sub-form display, one for the `make` action target. (`reference_to_property_info` for display, `status_reference_to_property_info` for `make ... on t_status`.)

---

## Pattern 19 — Sub-form Container Tasks (system taskRef panels)

Use when the same form section appears in multiple tasks (personal info at apply, review, sign)
or when a task needs a rich embedded form panel filled across multiple steps.

```xml
<!-- Static taskRef referencing a sub-form container -->
<data type="taskRef">
    <id>reference_to_personal_info</id><title/>
    <inits><init>t_personal_info</init></inits>
</data>

<!-- Sub-form container: system role + dataGroup + permanently alive place -->
<transition>
    <id>t_personal_info</id><x>208</x><y>80</y><label>Personal Information</label>
    <roleRef><id>system</id><logic><perform>true</perform></logic></roleRef>
    <dataGroup>
        <id>g_personal</id><cols>4</cols><layout>grid</layout>
        <dataRef><id>name</id><logic><behavior>editable</behavior><behavior>required</behavior></logic>
            <layout><x>0</x><y>0</y><rows>1</rows><cols>2</cols><template>material</template><appearance>outline</appearance></layout>
        </dataRef>
    </dataGroup>
</transition>

<!-- Permanently alive: tokens=1, Y=80 (top detail lane) -->
<place><id>p_personal_alive</id><x>112</x><y>80</y><tokens>1</tokens><static>false</static></place>
<arc><id>a_personal</id><type>read</type>
    <sourceId>p_personal_alive</sourceId><destinationId>t_personal_info</destinationId>
    <multiplicity>1</multiplicity></arc>
```

**Embedding in a main task — editable (user fills it) or visible (read-only):**
```xml
<dataRef>
    <id>reference_to_personal_info</id>
    <logic><behavior>editable</behavior></logic>
    <layout><x>0</x><y>0</y><rows>1</rows><cols>4</cols><template>material</template><appearance>outline</appearance></layout>
</dataRef>
```

**Rules:**
- `system` roleRef + dataGroup = the ONE valid exception to gotcha #44B
- The feeding place MUST have `tokens=1` (permanently alive) — never `tokens=0`
- Use `<inits><init>task_id</init></inits>` (plural `inits`) for static single-task reference
- Sub-form container lane: Y=80, above main flow Y=208
- Never `async.run { assignTask("sub_form_id") }` — these are not action tasks

---

## Pattern 20 — User-scoped Permissions (userRef + userList + caseLogic)

Use when a case should only be accessible to the specific user who created it,
not to all members of a role.

```xml
<!-- Top-level case permissions (before <role> declarations) -->
<roleRef>
    <id>default</id>
    <caseLogic><create>true</create></caseLogic>
</roleRef>
<roleRef>
    <id>banker</id>
    <caseLogic><view>true</view></caseLogic>
</roleRef>
<roleRef>
    <id>system</id>
    <caseLogic><delete>true</delete><view>true</view></caseLogic>
</roleRef>
<userRef>
    <id>applicant</id>
    <caseLogic><delete>true</delete><view>true</view></caseLogic>
</userRef>
```

```xml
<!-- userList field stores the instance owner -->
<data type="userList"><id>applicant</id><title>Applicant</title></data>
```

```groovy
// caseEvents create POST — capture creating user
email: f.email, name: f.name, surname: f.surname, applicant: f.applicant;
change name     value { loggedUser().name }
change surname  value { loggedUser().surname }
change email    value { loggedUser().email }
change applicant value { [loggedUser().id] }
```

```xml
<!-- Task accessible only to the instance owner -->
<userRef>
    <id>applicant</id>
    <logic><perform>true</perform></logic>
</userRef>
<assignPolicy>auto</assignPolicy>
```

**`loggedUser()` properties:** `.id` · `.name` · `.surname` · `.email`

| | `caseLogic` | task `logic` |
|-|---|---|
| Scope | Case list visibility | Task access |
| Values | `create`, `view`, `delete` | `perform`, `cancel`, `delegate` |
| Placement | Top-level `<roleRef>`/`<userRef>` | Inside `<transition>` |

> ⚠️ Role scope = ALL cases. UserList scope = per-case only. Use `userList` + `userRef` for owner-only access.

---

## Pattern 21 — Process Functions (reusable Groovy)

```xml
<function scope="process" name="calculate_payment">
    <![CDATA[
    { amount, period, monthly_payment ->
        change monthly_payment value { amount.value / (period.value * 12) }
    }
    ]]>
</function>
```

**Call from multiple field set events:**
```groovy
monthly_payment: f.monthly_payment, period: f.period, amount: f.amount;
calculate_payment(amount, period, monthly_payment)
```

**Placement:** `<function>` elements go after `<caseEvents>`, before `<role>` declarations.
**Signature:** `{ param1, param2 -> body }` — params are data field objects, same as `f.field_id` imports.

---

## Pattern 22 — Field Validation

```xml
<data type="text">
    <id>email</id><title>Email</title>
    <validations>
        <validation>
            <expression>^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$</expression>
            <message>Invalid email format</message>
        </validation>
    </validations>
</data>
```

**Numeric range:**
```xml
<validations>
    <validation>
        <expression>inrange 1,365</expression>
        <message>Min 1, max 365.</message>
    </validation>
</validations>
```

**Placement in `<data>` order:** `<id>` → `<title>` → `<validations>` → `<component>` → `<init>` → `<options>` → `<view>`

---

## Pattern 23 — GDPR / Personal Data Erasure

```groovy
// delete_personal_info task finish PRE
name: f.name, surname: f.surname, email: f.email, street: f.street;
change name    value { " " }
change surname value { " " }
change email   value { " " }
change street  value { " " }
```

**Flow:** All rejection paths converge into a shared `p_rejected` place → `t_delete_personal_info`.
After deletion, an `anonymized_status` task (accessible to banker only, not applicant) shows remaining non-personal data.

```xml
<data type="text">
    <id>delete_request</id><title>Delete Request</title>
    <init>Please delete my personal information</init>
</data>
```


## Pattern 24 — IPC Parent–Child: button + createCase + taskRef (button + createCase + taskRef panel)

**Use when:** one parent case must manage N child cases created dynamically by the user. Classic examples: insurance with insured persons, project with tasks, order with line items.

**Architecture:**
```
Parent process:  [t_main] ── button(Add) creates child ── taskRef panel shows child t1 tasks
Child process:   [start:1] → [t1: editable data] → [p2:0] ──read──→ [t2: read-only summary]
```

**Parent — required data fields:**
```xml
<!-- button to create child -->
<data type="button"><id>btn_add</id><title/><placeholder>Add</placeholder><init>1</init>
    <event type="set"><id>btn_add_set</id>
        <actions phase="pre"><action id="1"><![CDATA[
  process_id: f.process_id,
  children_cases: f.children_cases,
  children_tasks: f.children_tasks,
  total: f.total, unit_price: f.unit_price;

  def c   = createCase(process_id.value)
  def tid = findTask({ it.caseId.eq(c.stringId).and(it.transitionId.eq("t1")) })
  assignTask(tid)
  setData("t1", c, ["id_parent": ["value": useCase.stringId, "type": "text"]])
  change children_cases value { (children_cases.value ?: []) + c.stringId }
  change children_tasks  value { (children_tasks.value  ?: []) + tid.stringId }
  change total value { unit_price.value * (children_tasks.value.size() + 1) }
        ]]></action></actions>
    </event>
</data>

<!-- button to delete marked children -->
<data type="button"><id>btn_delete</id><title/><placeholder>Delete</placeholder><init>1</init>
    <event type="set"><id>btn_delete_set</id>
        <actions phase="pre"><action id="2"><![CDATA[
  children_tasks: f.children_tasks,
  children_cases: f.children_cases,
  total: f.total, unit_price: f.unit_price;

  children_tasks.value.each { tid ->
      def t = findTask({ it._id.eq(tid) })
      def c = findCase { it._id.eq(t.caseId) }
      if (c.getFieldValue("to_delete") == true) {
          change children_tasks  value { children_tasks.value  - tid }
          change children_cases  value { children_cases.value  - c.stringId }
          workflowService.deleteCase(c.stringId)
      }
  }
  change total value { unit_price.value * children_tasks.value.size() }
        ]]></action></actions>
    </event>
</data>

<!-- taskRef panel — displays child t1 tasks inline -->
<data type="taskRef"><id>children_tasks</id><title>Children</title></data>
<!-- caseRef — tracks child case IDs (for batch operations) -->
<data type="caseRef"><id>children_cases</id><title/></data>
<!-- hidden: stores child process full ID -->
<data type="text"><id>process_id</id><title/></data>
```

**Parent — setup in task assign event (sets workspace prefix and allowedNets):**
```groovy
// task assign PRE
process_id: f.process_id, children_cases: f.children_cases, parent_id: f.parent_id;
change process_id value { workspace + "child_process" }
change children_cases allowedNets { [process_id.value] }
change parent_id value { useCase.stringId }
```

**Parent — batch finish children on conclude (finish PRE then POST):**
```groovy
// finish PRE — finish all child t1 tasks (advances each child to t2)
children_tasks: f.children_tasks;
children_tasks.value.each { tid ->
    def t = findTask({ it._id.eq(tid) })
    if (t) finishTask(t)
}

// finish POST — collect child t2 (summary) tasks for readonly display
summary_tasks: f.summary_tasks, children_cases: f.children_cases;
change summary_tasks value {
    findTasks { it.caseId.in(children_cases.value).and(it.transitionId.eq("t2")) }
            ?.collect { it.stringId }
}
```

**Child process — minimal structure:**
```xml
<!-- Field to store parent case ID (foreign key) -->
<data type="text"><id>id_parent</id><title>Parent ID</title></data>
<!-- Boolean flag for delete marking -->
<data type="boolean"><id>to_delete</id><title>Delete</title><init>false</init></data>

<!-- t1: editable data entry — shown as subform in parent taskRef -->
<!-- t2: read-only summary — shown in parent after conclude -->
```

> ⚠️ `assignTask(tid)` in button `phase="pre"` is correct here — it is the one legitimate context where assignTask on a non-system task is valid. Without it the child task would not appear in the taskRef panel immediately.
> ⚠️ Child process needs NO actions of its own — all orchestration logic lives in the parent.
> ⚠️ `process_id` must contain the full workspace-prefixed ID: `workspace + "child_process"` or the processIdentifier parsing trick for anonymous contexts.

---

## Pattern 25 — IPC Child→Parent: self-registration via setData (setData push + set event)

**Use when:** child cases are created independently (not by parent button) and must associate themselves with a parent. Example: invoices register themselves into an existing order.

**Flow:**
```
Child (Invoice) finish register ──setData──► Parent (Order) "receiver" field
                                              └── set event fires → adds child to children list
```

**Parent — receiver field with set event:**
```xml
<data type="text"><id>new_child_id</id><title>New Child ID</title>
    <event type="set"><id>nci_set</id>
        <actions phase="post"><action id="N"><![CDATA[
  children_cases: f.children_cases, new_child_id: f.new_child_id;
  if (new_child_id.value !in (children_cases.value ?: []))
      change children_cases value { (children_cases.value ?: []) + new_child_id.value }
        ]]></action></actions>
    </event>
</data>
```

**Parent — populate dropdown options in child (which parents are eligible?):**
```groovy
// child task assign PRE — show only orders that reached "sent" state (token in p5)
parent_selector: f.parent_selector;
change parent_selector options {
    findCases { it.processIdentifier.eq(workspace + "order")
                .and(it.activePlaces.get("p5").eq(1)) }   // activePlaces filter WORKS in QueryDSL
            .collectEntries { [(it.stringId): "Order: " + it.stringId] }
}
```

**Child — push self into parent on finish:**
```groovy
// child register task finish POST
my_id: f.my_id, parent_id: f.parent_id;
def parentCase = findCase({ it._id.eq(parent_id.value) })
if (parentCase) {
    setData("t_receiver", parentCase, ["new_child_id": ["value": my_id.value, "type": "text"]])
}
```

> ⚠️ The receiver task (`t_receiver`) in the parent must be permanently alive — on a `read` arc from a place that always holds a token. If the task is not enabled when `setData` is called, the set event will not fire.
> ⚠️ `activePlaces.get("p_id").eq(1)` is valid QueryDSL and correctly filters cases by token position. This is different from `dataSet` field filters which are NOT supported.
> ⚠️ The bidirectional relationship (parent knows children, child knows parent) requires: parent stores `children_cases` caseRef; child stores `id_parent` text field.

---

## Pattern 26 — IPC Bulk Approval: parent processes N child tasks

**Use when:** a parent needs to display and decide on N child tasks simultaneously in one task, without opening each child case individually. Example: order bulk-approves all its associated invoices.

**Flow:**
```
Parent (Order) t_bulk assign PRE:
  1. find all child invoice approval tasks (transitionId=t2, userId=null)
  2. assignTask each of them (synchronize assign event)
  3. store their IDs in taskRef panel field

Parent (Order) t_bulk finish PRE:
  1. copy taskRef list to local variable
  2. clear taskRef field
  3. finishTask each of them (synchronize finish, token moves in each child)
```

**Parent — bulk approval task structure:**
```xml
<data type="taskRef"><id>approval_tasks</id><title>Invoices to Approve</title></data>
<data type="caseRef"><id>children_cases</id><title/></data>

<transition><id>t_bulk</id><x>784</x><y>208</y><label>Bulk Approval</label>
    <dataGroup>
        <id>g1</id><cols>4</cols><layout>grid</layout>
        <dataRef><id>approval_tasks</id>
            <logic><behavior>editable</behavior></logic>
            <layout><x>0</x><y>0</y><rows>1</rows><cols>4</cols>
                <template>material</template><appearance>outline</appearance></layout>
        </dataRef>
    </dataGroup>
    <event type="assign"><id>bulk_assign</id>
        <actions phase="pre"><action id="N"><![CDATA[
  approval_tasks: f.approval_tasks, children_cases: f.children_cases;

  // find all child approval tasks that are available (not yet assigned)
  change approval_tasks value {
      findTasks { it.caseId.in(children_cases.value)
                  .and(it.transitionId.eq("t_approval"))
                  .and(it.userId.isNull()) }
              ?.collect { it.stringId }
  }

  // synchronize assign — each child task gets assigned too
  approval_tasks.value.each { tid ->
      def t = findTask({ it._id.eq(tid) })
      if (t) assignTask(t)
  }
        ]]></action></actions>
    </event>
    <event type="finish"><id>bulk_finish</id>
        <actions phase="pre"><action id="M"><![CDATA[
  approval_tasks: f.approval_tasks;

  // copy list, clear field, then finish each — never iterate over live taskRef
  def ids = approval_tasks.value
  change approval_tasks value { [] }
  ids.each { tid ->
      def t = findTask({ it._id.eq(tid) })
      if (t) finishTask(t)    // token moves in each child based on its own variable arcs
  }
        ]]></action></actions>
    </event>
</transition>
```

> ⚠️ Child tasks must set their routing variable arcs BEFORE the parent calls `finishTask`. Since users edit child subforms directly in the parent taskRef panel, the child's field values (e.g. `decision`) are already set when finish fires — the routing actions in child's `finish PRE` execute at that point.
> ⚠️ Tasks returned by `findTasks` with `userId.isNull()` are unassigned — use this to avoid re-assigning already-assigned tasks on repeated bulk approval attempts.
> ⚠️ The bulk approval task itself should be on a `read` arc if it needs to be repeatable — so the parent can run bulk approval multiple times as new invoices arrive (Pattern 16b).
> ⚠️ `assignTask(t)` inside the `.each` loop is correct here — we are assigning child tasks from a button/task event context, not from `caseEvents`. These child tasks need to be assigned so their forms appear as editable subforms.

---

## Common Snippets

**Status + email:**
```groovy
status: f.status; change status value { "Approved" }  // finish PRE
email: f.email, status: f.status;                      // finish POST
sendEmail([email.value], "Update: ${useCase.title}", "Status: ${status.value}")
```

**Record approver:**
```groovy
approved_by: f.approved_by, approved_at: f.approved_at;
change approved_by value { userService.loggedOrSystem.email }
change approved_at value { java.time.LocalDateTime.now() }
```

**Conditional field visibility:**
```groovy
t_submit: t.submit_request, contract_type: f.contract_type, iban: f.iban;
make iban, required on t_submit when { return contract_type.value == "bank_transfer" }
make iban, hidden   on t_submit when { return contract_type.value != "bank_transfer" }
```

**Auto-trigger system task on case create:**
```xml
<caseEvents>
    <event type="create"><id>on_create</id>
        <actions phase="post"><action id="1"><![CDATA[
      async.run { assignTask("init_task"); finishTask("init_task") }
    ]]></action></actions>
    </event>
</caseEvents>
```

**Section divider:**
```xml
<data type="i18n"><id>div_1</id><title>Section</title><init>Section</init></data>
<dataRef><id>div_1</id><logic><behavior>editable</behavior></logic>
<layout><x>0</x><y>3</y><rows>1</rows><cols>4</cols><template>material</template><appearance>outline</appearance></layout>
<component><name>divider</name></component></dataRef>
```

**Dynamic options from external API:**
```groovy
country: f.country, city: f.city;
def conn = (java.net.HttpURLConnection) new java.net.URL(
        "https://api.example.com/cities?country=${country.value}").openConnection()
conn.setRequestMethod("GET"); conn.setConnectTimeout(5000); conn.setReadTimeout(10000)
def result = new groovy.json.JsonSlurper().parseText(conn.getInputStream().getText("UTF-8"))
change city options { result.collectEntries { [(it.code): it.name] } }
```

**LLM API call + JSON fence stripping:**
```groovy
api_key: f.api_key, prompt: f.prompt, result: f.result;
async.run {
    def conn = (java.net.HttpURLConnection) new java.net.URL("https://api.openai.com/v1/chat/completions").openConnection()
    conn.setRequestMethod("POST")
    conn.setRequestProperty("Content-Type", "application/json")
    conn.setRequestProperty("Authorization", "Bearer ${api_key.value}")
    conn.setDoOutput(true); conn.setConnectTimeout(15_000); conn.setReadTimeout(60_000)
    conn.outputStream.write(groovy.json.JsonOutput.toJson([
            model: "gpt-4o-mini", messages: [[role: "user", content: prompt.value ?: ""]]
    ]).getBytes("UTF-8"))
    def body = ""
    try { body = conn.inputStream.getText("UTF-8") }
    catch (e) { body = conn.errorStream?.getText("UTF-8") ?: '{"error":"unreachable"}' }
    def content = new groovy.json.JsonSlurper().parseText(body)?.choices?.getAt(0)?.message?.content ?: "{}"
    def normalized = content.replaceAll('(?m)^```(?:json)?\\s*','').replaceAll('(?m)^```\\s*$','').trim()
    def t = findTask { it.transitionId.eq("result_task").and(it.caseId.eq(useCase.stringId)) }
    if (t) setData(t, [result: [value: normalized, type: "text"]])
}
```

> ⚠️ API key: `text` field with `<value>sk-YOUR-KEY-HERE</value>`, `hidden` on all user-facing transitions
## GOTCHAS

| # | Rule |
|---|------|
| 1 | `multichoice_map` not `multichoice`; `enumeration_map` not `enumeration` — when field read in Groovy |
| 2 | Variable arc: source = **Transition** (never Place), reference = **`number` field** (never boolean), every option needs: number field + variable arc + destination place |
| 3 | Routing flags in **`phase="pre"`** — token moves after pre, before post |
| 4 | **One `<dataGroup>`** per transition — builder silently ignores rest |
| 5 | `caseEvents` only `create`/`delete`; placed **after metadata, before roles** |
| 6 | `task` variable only in transition events, not caseEvents |
| 7 | `setData` / `assignTask` / `finishTask` only inside `async.run`; only when target transition is enabled (input place has token) |
| 8 | XOR reconvergence → shared merge **PLACE** not shared transition (AND-join=deadlock); AND-join after OR-split = deadlock → use `from_X` variable arcs (`init=1`) |
| 9 | `f.field_id` only in import header, never in body |
| 10 | Special chars in XML text: `&`→`&amp;` `<`→`&lt;` `>`→`&gt;` — inside `<![CDATA[...]]>` no escaping needed |
| 11 | `taskRef` target must be permanently alive — on a `read` arc from a `tokens=1` place |
| 12 | System task chains — every system task fires next via `async.run` in finish post |
| 13 | AND-split needs dedicated **split transition** (system role) — place with two outgoing arcs = race condition |
| 14 | `<dataGroup>` order: `<id>` → `<cols>` → `<layout>grid</layout>` → `<title>` |
| 15 | All field reads in `caseEvents` require import header |
| 16 | Cancel from multiple states → one cancel transition per state |
| 17 | `from_X` OR-join fields: `<init>1</init>` — if `0`, join fires immediately at case creation |
| 18 | Loop revision arc → back to **same input place** as main flow, not new merge place |
| 19 | `button` field: `<init>1</init>` required; `<placeholder>` = label; `editable` in dataGroup |
| 20 | `createCase(id)` minimal form valid; get first task via `newCase.tasks.find { it.transition=="t1" }?.task` |
| 21 | **ALWAYS use `workspace + "process_id"` in `findCases`, `findTasks`, and `createCase`** — bare string literal causes silent lookup failures |
| 22 | **Empty `<caseEvents>` block causes eTask import error** — omit the entire block if no actions |
| 23 | **Permanently open task: `read` arc ONLY — never also a `regular` arc from the same place** |
| 24 | **`taskRef` `<init>` is for static single-task embeds only** — dynamic list: use `change taskref value { list + tid }` in button action |
| 25 | **`assignTask` in button `phase="pre"` is the one legitimate exception to C3** — needed so child task appears immediately in taskRef panel |
| 26 | **`workspace` keyword works only for logged-in users** — for anonymous context use processIdentifier parsing: `def prefix = useCase.processIdentifier - useCase.processIdentifier.split("/").last()` |
| 27 | **`activePlaces.get("p_id").eq(1)` IS valid in findCases QueryDSL** — `dataSet` field filters are NOT (MissingPropertyException) |
| 28 | **Bulk finish: copy list → clear taskRef → finish each** — `def ids = taskref.value; change taskref value { [] }; ids.each { finishTask(...) }` |
| 29 | **Multiple regular arcs INTO same transition = AND-join = fires only when ALL sources have tokens simultaneously** — if places are mutually exclusive → deadlock. Fix: shared merge place (XOR) or from_X variable arcs (OR) |
| 30 | **System task with `<dataGroup>` is valid ONLY as a sub-form container** (read-arc only, tokens=1 place). System action tasks (fired via async.run) must NOT have dataGroup |
| 31 | **Read-arc source place must receive a token** — `tokens=0` + no incoming arc → task depending on it never enables (silent deadlock) |
| 32 | **Child self-registration**: child pushes ID to parent via `setData("t_receiver", parentCase, [...])` → triggers parent's `set` event → parent adds child to caseRef/taskRef |
| 33 | `findTasks { it.caseId.in(list) }` — `.in()` filters across multiple case IDs |
| 34 | `<validations><validation><expression>...</expression><message>...</message></validation></validations>` — goes between `<title>` and `<init>` in `<data>` |
| 35 | `loggedUser().id / .name / .surname / .email` — available in caseEvents and transition events; use `[loggedUser().id]` for userList field |
| 36 | **Circular token loop: transition T → place P (regular) + place P → transition T (read) = confused design.** T deposits token into P, then P's read arc keeps T permanently enabled. If T ALSO has a regular incoming arc from the flow, it mixes flow task (consumes upstream token) with permanently open task — wrong pattern. Fix: split into (A) system task that moves token to P, (B) separate human task with ONLY a read arc from P. If no regular incoming arc, just remove the regular T→P outgoing arc and set `tokens=1` on P instead. |
| 37 | **Read arc on a flow task is redundant and misleading.** If a task already has a regular incoming arc from the flow (`p_open → task`), adding a read arc from a `tokens=1` permanent place does NOT make it permanently open — it just adds an extra enablement condition. The task still fires exactly once (consuming the flow token) and then stops. A task is either (A) a flow task: regular in, regular out, fires once; or (B) permanently open: ONLY read arc from `tokens=1` place, no regular in, no regular out. Never combine both on the same transition. |
| 38 | **Every place you declare must be connected.** A place with no arcs at all (no incoming, no outgoing) is an isolated dead element — it was created but never wired into the network. Either connect it or delete it. Common cause: LLM creates `p_approval` intending it to be the input for `t_approve`, but then connects transitions differently and leaves the place dangling. |
| 39 | **A process must have at most one terminal place (sink).** A sink place receives tokens but has no outgoing arcs — tokens deposited there are trapped forever. One sink is fine (the "Done" end state). Multiple sinks mean the process has multiple dead ends — branches that lead nowhere. Every terminal path must converge into the single shared end place, or each path must have its own next step. | If a task already has a regular incoming arc from the flow (`p_open → task`), adding a read arc from a `tokens=1` permanent place does NOT make it permanently open — it just adds an extra enablement condition. The task still fires exactly once (consuming the flow token) and then stops. A task is either (A) a flow task: regular in, regular out, fires once; or (B) permanently open: ONLY read arc from `tokens=1` place, no regular in, no regular out. Never combine both on the same transition. | T deposits token into P, then P's read arc keeps T permanently enabled. If T ALSO has a regular incoming arc from the flow, it mixes flow task (consumes upstream token) with permanently open task — wrong pattern. Fix: split into (A) system task that moves token to P, (B) separate human task with ONLY a read arc from P. If no regular incoming arc, just remove the regular T→P outgoing arc and set `tokens=1` on P instead. |