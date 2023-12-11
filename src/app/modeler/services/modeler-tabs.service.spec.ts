import {TestBed} from '@angular/core/testing';

import {ModelerTabsService} from './modeler-tabs.service';

describe('ModelerTabsService', () => {
  let service: ModelerTabsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelerTabsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
