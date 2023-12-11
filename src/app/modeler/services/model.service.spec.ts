import {TestBed} from '@angular/core/testing';

import {ModelService} from './model.service';
import {HttpClientModule} from '@angular/common/http';
import {MatSnackBarModule} from '@angular/material/snack-bar';

describe('ModelService', () => {
    let service: ModelService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                MatSnackBarModule
            ]
        });
        service = TestBed.inject(ModelService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
