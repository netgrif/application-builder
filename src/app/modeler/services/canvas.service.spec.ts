import {TestBed} from '@angular/core/testing';

import {CanvasService} from './canvas.service';
import {HttpClientModule} from '@angular/common/http';
import {MaterialImportModule} from '../../material-import/material-import.module';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';

describe('CanvasService', () => {
    let service: CanvasService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                MatSnackBarModule,
                MaterialImportModule,
                MatDialogModule
            ]
        });
        service = TestBed.inject(CanvasService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
