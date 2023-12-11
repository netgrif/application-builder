import {TestBed} from '@angular/core/testing';

import {TransitionToTaskService} from './transition-to-task.service';

describe('TransitionToTaskService', () => {
    let service: TransitionToTaskService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TransitionToTaskService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
