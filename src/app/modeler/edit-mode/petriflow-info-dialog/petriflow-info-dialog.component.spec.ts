import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetriflowInfoDialogComponent } from './petriflow-info-dialog.component';

describe('PetriflowInfoDialogComponent', () => {
  let component: PetriflowInfoDialogComponent;
  let fixture: ComponentFixture<PetriflowInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PetriflowInfoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PetriflowInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
