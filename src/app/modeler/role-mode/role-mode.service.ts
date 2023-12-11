import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RoleModeService {
  event: EventEmitter<void>;

  constructor() {
    this.event = new EventEmitter();
  }
}
