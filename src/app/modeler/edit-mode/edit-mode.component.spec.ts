import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditModeComponent } from './edit-mode.component';

describe('BpmnModeComponent', () => {
  let component: EditModeComponent;
  let fixture: ComponentFixture<EditModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditModeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
