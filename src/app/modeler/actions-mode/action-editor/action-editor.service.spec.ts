import {TestBed} from '@angular/core/testing';
import {ActionEditorService} from './action-editor.service';
import {
  Action,
  EventPhase,
  PetriNet,
  Transition,
  TransitionEvent,
  TransitionEventType
} from '@netgrif/petriflow';

describe('ActionEditorService', () => {
  let service: ActionEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActionEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('allocates an id after every action in the process', () => {
    const model = new PetriNet();
    const transition = new Transition(0, 0, 'transition');
    const event = new TransitionEvent(TransitionEventType.FINISH, 'finish');
    event.addAction(new Action('5', 'existing'), EventPhase.PRE);
    transition.eventSource.addEvent(event);
    model.addTransition(transition);

    service.updateIds(model);

    expect(service.nextId()).toBe('6');
  });
});
