import {HttpClientModule} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';

import {ModelService} from './model.service';

describe('ModelService', () => {
  let service: ModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        MatSnackBarModule,
      ],
    });
    service = TestBed.inject(ModelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
