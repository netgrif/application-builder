import {Logic, PetriNet, TransitionPermissionRef} from '@netgrif/petriflow';

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
