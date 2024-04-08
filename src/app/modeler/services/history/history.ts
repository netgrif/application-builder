import {HistoryChange} from './history-change';

export class History<T> {
    private memory: Array<HistoryChange<T>>;
    private _head: number;
    private readonly limit: number;

    constructor(limit: number = 100) {
        this.memory = new Array<HistoryChange<T>>();
        this.limit = limit;
        this._head = -1;
    }

    public get record(): T {
        return this.memory[this._head]?.record;
    }

    public push(record: T, message: string): HistoryChange<T> {
        if (this.isUpToDate()) {
            if (this.isFull()) {
                this.memory.shift();
            }
        } else {
            this.memory = this.memory.slice(0, this._head + 1);
        }
        this._head = this.size - 1;
        const update = new HistoryChange<T>(record, this.head, this.size, message);
        this.memory.push(update);
        return update;
    }

    public undo(): T | undefined {
        if (this._head === 0) {
            return undefined;
        }
        this._head--;
        return this.record;
    }

    public redo(): T | undefined {
        if (this._head === this.memory.length - 1) {
            return undefined;
        }
        this._head++;
        return this.record;
    }

    public isFull(): boolean {
        return this.size === this.limit;
    }

    public isUpToDate(): boolean {
        return this._head === this.size - 1;
    }

    public get size(): number {
        return this.memory.length;
    }

    public get head(): number {
        return this._head;
    }
}
