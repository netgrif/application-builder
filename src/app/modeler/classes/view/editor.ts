import {DataView, DataViewType} from './dataView';

export class Editor extends DataView {
  constructor() {
    super(DataViewType.EDITOR);
  }

  toXml(): string {
    return '<editor/>';
  }
}
