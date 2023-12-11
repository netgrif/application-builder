import {DataView, DataViewType} from './dataView';

export class Table extends DataView {

  constructor() {
    super(DataViewType.TABLE);
  }

  toXml(): string {
    return '<table/>';
  }
}
