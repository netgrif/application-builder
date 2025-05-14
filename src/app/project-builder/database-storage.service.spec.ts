import { TestBed } from '@angular/core/testing';

import { DatabaseStorageService } from './database-storage.service';

describe('DatabaseStorageService', () => {
  let service: DatabaseStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
