import {EventEmitter, Injectable} from '@angular/core';
import {DataType, DataVariable} from '@netgrif/petriflow';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataModeService {
  event: EventEmitter<void>;
  itemData: BehaviorSubject<DataVariable>;

  constructor() {
    this.event = new EventEmitter();
    this.itemData = new BehaviorSubject<DataVariable>(new DataVariable('first', DataType.TEXT)); // TODO ReplaySubject / undefined init hodnota
  }
}
