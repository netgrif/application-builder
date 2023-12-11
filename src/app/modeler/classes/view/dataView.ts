export abstract class DataView {
  protected constructor(type: DataViewType) {
    this._type = type;
  }

  private _type: DataViewType;

  get type(): DataViewType {
    return this._type;
  }

  abstract toXml(): string;
}

export enum DataViewType {
  AREA = 'area',
  AUTOCOMPLETE = 'autocomplete',
  BUTTON_TYPE = 'buttonType',
  EDITOR = 'editor',
  HTML_EDITOR = 'htmlEditor',
  LIST = 'list',
  TREE = 'tree',
  TABLE = 'table',
  IMAGE = 'image',
  STEPPER = 'stepper'
}
