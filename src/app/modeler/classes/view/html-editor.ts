import {DataView, DataViewType} from './dataView';

export class HtmlEditor extends DataView {

    constructor() {
        super(DataViewType.HTML_EDITOR);
    }

    toXml(): string {
        return '<htmlEditor/>';
    }
}
