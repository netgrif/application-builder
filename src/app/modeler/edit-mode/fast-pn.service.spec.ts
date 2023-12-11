import {TestBed} from '@angular/core/testing';

import {FastPnService} from './fast-pn.service';

describe('FastPnService', () => {
  let service: FastPnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FastPnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
