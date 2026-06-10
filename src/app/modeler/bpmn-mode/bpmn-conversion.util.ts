import {I18nString, Logic, PetriNet, Role, TransitionPermissionRef} from '@netgrif/petriflow';

// bpmn2pn maps every BPMN element X to a transition with id "<X>_t".
export const TRANSITION_SUFFIX = '_t';

/** BPMN activity id (== enrichment key) → converted Petriflow transition id. */
export function activityKeyToTransitionId(key: string): string {
    return key + TRANSITION_SUFFIX;
}

/** Converted Petriflow transition id → BPMN activity id (enrichment key). */
export function transitionIdToActivityKey(transitionId: string): string {
    return transitionId.endsWith(TRANSITION_SUFFIX)
        ? transitionId.slice(0, -TRANSITION_SUFFIX.length)
        : transitionId;
}

// BPMN local-names that represent real, user-facing tasks.
const TASK_LOCAL_NAMES = [
    'task', 'userTask', 'serviceTask', 'manualTask', 'scriptTask',
    'sendTask', 'receiveTask', 'businessRuleTask', 'callActivity', 'subProcess',
];

/**
 * bpmn2pn turns control-flow elements (end events, gateways, …) into extra
 * "synthetic" transitions and emits a "system" role, but never assigns it.
 * Those synthetic transitions (e.g. the "finalize" transition produced for an
 * end event) should be performed by the system. Real task transitions must NOT
 * get an automatic performer — the user assigns their roles.
 *
 * @param taskBpmnIds ids of the BPMN elements that are real tasks. A transition
 *                    "<X>_t" is a real task iff X is in this set.
 */
export function assignSystemPerformer(model: PetriNet | undefined, taskBpmnIds: Set<string>): void {
    if (!model) return;
    const systemRole = model.getRoles().find(r => r.id === 'system') ?? model.getRoles()[0];
    if (!systemRole) return;

    model.getTransitions().forEach(t => {
        const bpmnId = t.id.endsWith(TRANSITION_SUFFIX)
            ? t.id.slice(0, -TRANSITION_SUFFIX.length)
            : t.id;
        const isRealTask = taskBpmnIds.has(bpmnId);

        if (!isRealTask && t.roleRefs.length === 0 && t.userRefs.length === 0) {
            const ref = new TransitionPermissionRef(systemRole.id);
            const logic = new Logic();
            logic.perform = true;
            ref.logic = logic;
            t.roleRefs = [ref];
        }
    });
}

/** Collect the ids of all real-task elements declared in a BPMN XML string. */
export function extractTaskIds(bpmnXml: string): Set<string> {
    const ids = new Set<string>();
    const re = new RegExp(
        `<(?:[\\w-]+:)?(?:${TASK_LOCAL_NAMES.join('|')})\\b[^>]*?\\sid="([^"]+)"`,
        'g'
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(bpmnXml)) !== null) {
        ids.add(m[1]);
    }
    return ids;
}

/** A Petriflow role derived from a BPMN pool/participant or swimlane, plus the
 *  BPMN element ids whose tasks should reference it with a perform permission. */
export interface BpmnRoleSpec {
    id: string;
    title: string;
    taskIds: Set<string>;
}

function toRoleId(name: string): string {
    const id = name.trim().replace(/\s+/g, ' ').toLowerCase()
        .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return id || 'role';
}

function cleanName(name: string): string {
    return name.replace(/\s+/g, ' ').trim();
}

/**
 * The remote bpmn2pn service ignores pools/participants and swimlanes, so the
 * roles a modeller drew (e.g. a "Recourse Clerk" pool) are dropped and only the
 * synthetic "system" role survives. We recover them here, mirroring the thesis
 * mapping: each lane → role with its flow nodes; otherwise each participant/pool
 * → role over its process's tasks.
 */
export function extractRoles(bpmnXml: string): BpmnRoleSpec[] {
    const specs: BpmnRoleSpec[] = [];
    let doc: Document;
    try {
        doc = new DOMParser().parseFromString(bpmnXml, 'application/xml');
    } catch {
        return specs;
    }
    if (!doc || doc.getElementsByTagName('parsererror').length) return specs;

    const byLocal = (root: Element | Document, local: string): Element[] =>
        Array.from(root.getElementsByTagNameNS('*', local));

    // Swimlanes are the most precise membership signal.
    const lanes = byLocal(doc, 'lane');
    if (lanes.length) {
        for (const lane of lanes) {
            const name = lane.getAttribute('name');
            if (!name) continue;
            const refs = byLocal(lane, 'flowNodeRef')
                .map(r => r.textContent?.trim())
                .filter((v): v is string => !!v);
            if (!refs.length) continue;
            specs.push({id: toRoleId(name), title: cleanName(name), taskIds: new Set(refs)});
        }
        if (specs.length) return specs;
    }

    // No lanes → pools/participants.
    const participants = byLocal(doc, 'participant').filter(p => p.getAttribute('name'));
    const processes = byLocal(doc, 'process');
    const allTasks = extractTaskIds(bpmnXml);

    if (participants.length === 1) {
        const name = participants[0].getAttribute('name')!;
        specs.push({id: toRoleId(name), title: cleanName(name), taskIds: allTasks});
    } else if (participants.length > 1) {
        for (const p of participants) {
            const name = p.getAttribute('name')!;
            const procRef = p.getAttribute('processRef');
            const proc = processes.find(pr => pr.getAttribute('id') === procRef);
            const taskIds = new Set<string>();
            if (proc) {
                for (const local of TASK_LOCAL_NAMES) {
                    byLocal(proc, local).forEach(el => {
                        const id = el.getAttribute('id');
                        if (id) taskIds.add(id);
                    });
                }
            }
            if (taskIds.size) specs.push({id: toRoleId(name), title: cleanName(name), taskIds});
        }
    }
    return specs;
}

/**
 * Add the pool/lane-derived roles to the model and give every (real) task in a
 * pool/lane a perform roleRef. Runs after the structural convert; idempotent.
 */
export function assignPoolRoles(
    model: PetriNet | undefined, specs: BpmnRoleSpec[], taskBpmnIds: Set<string>
): void {
    if (!model || !specs.length) return;
    for (const spec of specs) {
        let role = model.getRole(spec.id);
        if (!role) {
            role = new Role(spec.id);
            role.title = new I18nString(spec.title);
            model.addRole(role);
        }
        for (const taskId of spec.taskIds) {
            if (!taskBpmnIds.has(taskId)) continue;   // only real tasks, not events/gateways
            const t = model.getTransition(activityKeyToTransitionId(taskId));
            if (!t) continue;
            if (!t.roleRefs.some(r => r.id === spec.id)) {
                const ref = new TransitionPermissionRef(spec.id);
                const logic = new Logic();
                logic.perform = true;
                ref.logic = logic;
                t.roleRefs = [...t.roleRefs, ref];
            }
        }
    }
}
