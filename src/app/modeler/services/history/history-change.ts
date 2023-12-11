export class HistoryChange {

    private readonly _head: number;
    private readonly _size: number;

    constructor(head: number, size: number) {
        this._head = head;
        this._size = size;
    }

    get head(): number {
        return this._head;
    }

    get size(): number {
        return this._size;
    }
}
