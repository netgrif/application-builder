import {DataView, DataViewType} from './dataView';

export class Tree extends DataView {

  constructor() {
    super(DataViewType.TREE);
  }

  toXml(): string {
    return '<tree/>';
  }
}
