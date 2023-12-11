import { TestBed } from '@angular/core/testing';

import { GridsterFieldToEngineFieldService } from './gridster-field-to-engine-field.service';

describe('GridsterFieldToEngineFieldService', () => {
  let service: GridsterFieldToEngineFieldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GridsterFieldToEngineFieldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
