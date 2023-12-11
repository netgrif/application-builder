
export abstract class DataView {
    private _type: DataViewType;

    protected constructor(type: DataViewType) {
        this._type = type;
    }

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
