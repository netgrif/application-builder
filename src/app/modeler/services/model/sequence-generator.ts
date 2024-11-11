import {DataVariable, Element, Role} from '@netgrif/petriflow';

export class SequenceGenerator {
    private _id = 0;
    private readonly _prefix: string;

    constructor(prefix: string) {
        this._prefix = prefix;
    }

    public next(): string {
        this._id++;
        return `${this._prefix}${this._id}`;
    }

    public reset(collection: Array<Element | DataVariable | Role>): void {
        this._id = collection.filter(e => e.id.startsWith(this._prefix))
            .map(e => Number.parseInt(e.id.substring(1), 10))
            .filter(elementId => !isNaN(elementId))
            .reduce((a, b) => Math.max(a, b), 0);
    }
}
