import {CaseEventType, DataEventType, ProcessEventType, TransitionEventType, RoleEventType} from '@netgrif/petriflow';

export type EventType = TransitionEventType | DataEventType | CaseEventType | ProcessEventType | RoleEventType;
