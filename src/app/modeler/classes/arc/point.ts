export class Point {
    private _x: number;
    private _y: number;
    private _immutable: boolean;

    constructor(x, y, immutable = false) {
        this._x = x;
        this._y = y;
        this._immutable = immutable;
    }

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        if (!this._immutable) {
            this._x = value;
        } else {
            throw new Error('x coordinate of immutable point cannot be set');
        }
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        if (!this._immutable) {
            this._y = value;
        } else {
            throw new Error('y coordinate of immutable point cannot be set');
        }
    }

    static immutable(x, y) {
        return new Point(x, y, true);
    }
}
