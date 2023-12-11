import {TestBed} from '@angular/core/testing';

import {ModelExportService} from './model-export.service';

describe('ModelExportService', () => {
  let service: ModelExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
