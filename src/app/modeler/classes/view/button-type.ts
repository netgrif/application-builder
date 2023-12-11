import {DataView, DataViewType} from './dataView';

export class ButtonType extends DataView {

  constructor() {
    super(DataViewType.BUTTON_TYPE);
  }

  toXml(): string {
    return '<buttonType/>';
  }
}
