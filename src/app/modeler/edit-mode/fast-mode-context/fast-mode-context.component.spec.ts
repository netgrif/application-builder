import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FastModeContextComponent} from './fast-mode-context.component';

describe('FastModeContextComponent', () => {
  let component: FastModeContextComponent;
  let fixture: ComponentFixture<FastModeContextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FastModeContextComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FastModeContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
