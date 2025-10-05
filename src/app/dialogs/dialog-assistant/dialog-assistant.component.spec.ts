import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MaterialImportModule} from '../../material-import/material-import.module';

import {DialogAssistantComponent} from './dialog-assistant.component';

describe('DialogAssistantComponent', () => {
  let component: DialogAssistantComponent;
  let fixture: ComponentFixture<DialogAssistantComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DialogAssistantComponent],
      imports: [MaterialImportModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
