// export abstract class MasterDetailService<T> implements OnDestroy {
// private _dataSource: Array<T>;
// private readonly _selectedItem: BehaviorSubject<T>;
//
// protected constructor(masterData: Array<T>) {
//     this.dataSource = masterData;
//     this._selectedItem = new BehaviorSubject<T>(this.dataSource[0]);
// }
//
// ngOnDestroy(): void {
//     this._selectedItem.complete();
// }
//
// public abstract get masterData(): Array<T>;
//
// public abstract create(): T;
//
// public abstract delete(item: T): void;
//
// get dataSource(): Array<T> {
//     return this._dataSource;
// }
//
// set dataSource(value: Array<T>) {
//     this._dataSource = value;
// }
//
// get selectedItem(): BehaviorSubject<T> {
//     return this._selectedItem;
// }
//
// public select(value: T): void {
//     this._selectedItem.next(value);
// }
//
// public get selected(): BehaviorSubject<T> {
//     return this._selectedItem;
// }
//
// public get selectedValue(): T {
//     return this._selectedItem.value;
// }
//
// compare(a: number | string, b: number | string, isAsc: boolean): number {
//     return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
// }
// }
