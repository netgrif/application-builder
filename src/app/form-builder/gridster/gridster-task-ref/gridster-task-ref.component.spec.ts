import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridsterTaskRefComponent } from './gridster-task-ref.component';

describe('GridsterTaskRefComponent', () => {
  let component: GridsterTaskRefComponent;
  let fixture: ComponentFixture<GridsterTaskRefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridsterTaskRefComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GridsterTaskRefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
