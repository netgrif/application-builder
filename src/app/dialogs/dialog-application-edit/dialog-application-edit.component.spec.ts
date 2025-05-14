import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogApplicationEditComponent } from './dialog-application-edit.component';

describe('DialogApplicationEditComponent', () => {
  let component: DialogApplicationEditComponent;
  let fixture: ComponentFixture<DialogApplicationEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogApplicationEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogApplicationEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
