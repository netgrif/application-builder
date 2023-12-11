import {TestBed} from '@angular/core/testing';

import {GridsterService} from './gridster.service';
import {HttpClientModule} from '@angular/common/http';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';

describe('GridsterService', () => {
    let service: GridsterService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                MatSnackBarModule,
                MaterialImportModule,
                MatDialogModule
            ]
        });
        service = TestBed.inject(GridsterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
