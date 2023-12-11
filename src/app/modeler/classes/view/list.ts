import {DataView, DataViewType} from './dataView';

export class List extends DataView {
  constructor(numberOfRows = 0) {
    super(DataViewType.LIST);
    this._numberOfRows = numberOfRows;
  }

  private _numberOfRows: number;

  get numberOfRows(): number {
    return this._numberOfRows;
  }

  set numberOfRows(value: number) {
    this._numberOfRows = value;
  }

  toXml(): string {
    if (this._numberOfRows === undefined || this._numberOfRows < 1) {
      return '<list/>';
    }
    return `<list>${this._numberOfRows}</list>`;
  }
}
