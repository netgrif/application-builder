import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {FlexModule} from '@ngbracket/ngx-layout';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {MatFormField, MatLabel, MatPrefix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {ModelService} from '../../services/model/model.service';
import {DataVariable, I18nWithDynamic} from '@netgrif/petriflow';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

@Component({
  selector: 'nab-task-ref-init-field',
  templateUrl: './task-ref-init-field.component.html',
  styleUrl: './task-ref-init-field.component.scss'
})
export class TaskRefInitFieldComponent {

    @Input() taskRef: DataVariable;
    taskRefFormControl: FormControl;
    @ViewChild('taskRefInput') taskRefInput: ElementRef<HTMLInputElement>;

    constructor(private _modelService: ModelService) {
        this.taskRefFormControl = new FormControl('');
    }

    removeInit(index: number): void {
        if (index >= 0) {
            this.taskRef.inits.splice(index, 1);
        }
    }

    addInit($event: MatChipInputEvent): void {
        this.taskRef.inits.push(new I18nWithDynamic($event.value));

        $event.chipInput!.clear();
        this.taskRefFormControl.setValue(null);
    }

    selectInit($event: MatAutocompleteSelectedEvent): void {
        this.taskRef.inits.push(new I18nWithDynamic($event.option.value));
        this.taskRefInput.nativeElement.value = '';
        this.taskRefFormControl.setValue(null);
    }

    get tasks() {
        return this._modelService.model.getTransitions().filter(t => {
            return !this.taskRef.inits.some(init => init.value === t.id);
        });
    }

    prettyTask(taskId: string): string {
        const task = this._modelService.model.getTransition(taskId);
        if (task === undefined) {
            return taskId;
        }
        const taskTitle = task.label.value ? `${task.label.value} ` : '';
        return `${taskTitle} [${taskId}]`;
    }
}
