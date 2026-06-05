import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SelectedTransitionService {

  private _id: string;
  /** Where the form / actions editor should return on "Back". Defaults to the Petriflow edit view. */
  private _returnUrl = '/modeler';

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get returnUrl(): string {
    return this._returnUrl || '/modeler';
  }

  set returnUrl(value: string) {
    this._returnUrl = value || '/modeler';
  }
}
