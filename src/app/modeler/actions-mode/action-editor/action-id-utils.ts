import {Action, Event, PetriNet} from '@netgrif/petriflow';

export function collectActions(model: PetriNet): Array<Action> {
    const actions = new Array<Action>();
    const appendEvents = (events: Array<Event<unknown>>): void => {
        events.forEach(event => actions.push(...event.preActions, ...event.postActions));
    };

    appendEvents(model.getProcessEvents());
    appendEvents(model.getCaseEvents());
    model.getRoles().forEach(role => appendEvents(role.getEvents()));
    model.getTransitions().forEach(transition => {
        appendEvents(transition.eventSource.getEvents());
        transition.dataGroups.forEach(group => {
            group.getDataRefs().forEach(dataRef => appendEvents(dataRef.getEvents()));
        });
    });
    model.getDataSet().forEach(data => appendEvents(data.getEvents()));
    return actions;
}

export function normalizeActionIds(model: PetriNet): number {
    const actions = collectActions(model);
    let lastNumericId = actions.reduce((maximum, action) => {
        const id = action.id?.trim();
        return /^\d+$/.test(id) ? Math.max(maximum, Number(id)) : maximum;
    }, 0);
    const usedIds = new Set<string>();

    actions.forEach(action => {
        const id = action.id?.trim();
        if (id && !usedIds.has(id)) {
            action.id = id;
            usedIds.add(id);
            return;
        }
        let replacement: string;
        do {
            replacement = String(++lastNumericId);
        } while (usedIds.has(replacement));
        action.id = replacement;
        usedIds.add(replacement);
    });

    return lastNumericId;
}
