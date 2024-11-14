import {Component, Input} from '@angular/core';
import {GridsterDataField} from '../classes/gridster-data-field';

@Component({
  selector: 'nab-gridster-task-ref',
  templateUrl: './gridster-task-ref.component.html',
  styleUrl: './gridster-task-ref.component.scss'
})
export class GridsterTaskRefComponent {

    @Input() public dataField: GridsterDataField;
}
