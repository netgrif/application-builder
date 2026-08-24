import {
    Action,
    EventPhase,
    PetriNet,
    Transition,
    TransitionEvent,
    TransitionEventType
} from '@netgrif/petriflow';
import {collectActions, normalizeActionIds} from './action-id-utils';

describe('action id utilities', () => {
    it('replaces duplicate and missing ids across transitions', () => {
        const model = new PetriNet();
        const firstTransition = new Transition(0, 0, 'first');
        const firstEvent = new TransitionEvent(TransitionEventType.FINISH, 'first_finish');
        firstEvent.addAction(new Action('1', 'first'), EventPhase.PRE);
        firstEvent.addAction(new Action('5', 'highest'), EventPhase.POST);
        firstTransition.eventSource.addEvent(firstEvent);
        model.addTransition(firstTransition);

        const secondTransition = new Transition(0, 0, 'second');
        const secondEvent = new TransitionEvent(TransitionEventType.FINISH, 'second_finish');
        secondEvent.addAction(new Action('1', 'duplicate'), EventPhase.PRE);
        secondEvent.addAction(new Action(undefined, 'missing'), EventPhase.POST);
        secondTransition.eventSource.addEvent(secondEvent);
        model.addTransition(secondTransition);

        expect(normalizeActionIds(model)).toBe(7);
        expect(collectActions(model).map(action => action.id)).toEqual(['1', '5', '6', '7']);
    });

    it('preserves unique numeric and custom ids', () => {
        const model = new PetriNet();
        const transition = new Transition(0, 0, 'transition');
        const event = new TransitionEvent(TransitionEventType.FINISH, 'finish');
        event.addAction(new Action('3', 'numeric'), EventPhase.PRE);
        event.addAction(new Action('custom', 'custom'), EventPhase.POST);
        transition.eventSource.addEvent(event);
        model.addTransition(transition);

        expect(normalizeActionIds(model)).toBe(3);
        expect(collectActions(model).map(action => action.id)).toEqual(['3', 'custom']);
    });
});
