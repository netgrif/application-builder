import {TestBed} from '@angular/core/testing';

import {MortgageService} from './mortgage.service';
import {MaterialImportModule} from '../material-import/material-import.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('MortgageServiceService', () => {
  let service: MortgageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialImportModule, HttpClientTestingModule],
    });
    service = TestBed.inject(MortgageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
