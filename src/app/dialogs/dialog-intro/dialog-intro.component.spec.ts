import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogIntroComponent } from './dialog-intro.component';

describe('DialogIntroComponent', () => {
  let component: DialogIntroComponent;
  let fixture: ComponentFixture<DialogIntroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogIntroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogIntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
