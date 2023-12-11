import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpmnModeEditorComponent } from './bpmn-mode-editor.component';

describe('BpmnModeEditorComponent', () => {
  let component: BpmnModeEditorComponent;
  let fixture: ComponentFixture<BpmnModeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BpmnModeEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BpmnModeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
