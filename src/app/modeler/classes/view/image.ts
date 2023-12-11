import {DataView, DataViewType} from './dataView';

export class Image extends DataView {

    constructor() {
        super(DataViewType.IMAGE);
    }

    toXml(): string {
        return '<image/>';
    }
}
