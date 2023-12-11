import {DataView, DataViewType} from './dataView';

export class Area extends DataView {
    constructor() {
        super(DataViewType.AREA);
    }

    toXml(): string {
        return '<area/>';
    }
}
