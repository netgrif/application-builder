import {History} from './history';

export class HistoryChange<T> {

    private readonly _record: T;
    private readonly _message: string;
    private readonly _head: number;
    private readonly _size: number;

    constructor(record: T, head: number, size: number, message: string) {
        this._record = record;
        this._head = head;
        this._size = size;
        this._message = message;
        console.log(`History: head=${this._head}, size=${this._size}, message=${this._message}`);
    }

    static of<T>(history: History<T>, source: string): HistoryChange<T> {
        return new HistoryChange(history.record, history.head, history.size, source);
    }

    get record(): T {
        return this._record;
    }

    get head(): number {
        return this._head;
    }

    get size(): number {
        return this._size;
    }

    get message(): string {
        return this._message;
    }
}
