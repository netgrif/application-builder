import { TestBed } from '@angular/core/testing';

import { BpmnEditService } from './bpmn-edit.service';

describe('BpmnEditService', () => {
  let service: BpmnEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BpmnEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
