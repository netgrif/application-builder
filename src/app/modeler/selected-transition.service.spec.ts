import {TestBed} from '@angular/core/testing';

import {SelectedTransitionService} from './selected-transition.service';

describe('SelectedTransitionService', () => {
  let service: SelectedTransitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedTransitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
