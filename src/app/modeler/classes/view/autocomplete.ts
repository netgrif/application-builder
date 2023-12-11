import {DataView, DataViewType} from './dataView';

export class Autocomplete extends DataView {
  constructor() {
    super(DataViewType.AUTOCOMPLETE);
  }

  toXml(): string {
    return '<autocomplete/>';
  }
}
