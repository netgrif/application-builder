export enum Type {
    MODEL,
    TASK,
    DATA,
    ROLE
}

export class TranslationGroupConfiguration {
    private _type: Type;
    private _icon: string;
    private _title: string;
    private _description: string;
    private _disabled: () => boolean;
    private _disabledDescription: string;

    constructor(type: Type, icon: string, title: string, description: string, disabled: () => boolean, disabledDescription: string) {
        this._type = type;
        this._icon = icon;
        this._title = title;
        this._description = description;
        this._disabled = disabled;
        this._disabledDescription = disabledDescription;
    }

    get type(): Type {
        return this._type;
    }

    set type(value: Type) {
        this._type = value;
    }

    get icon(): string {
        return this._icon;
    }

    set icon(value: string) {
        this._icon = value;
    }

    get title(): string {
        return this._title;
    }

    set title(value: string) {
        this._title = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get disabled(): () => boolean {
        return this._disabled;
    }

    set disabled(value: () => boolean) {
        this._disabled = value;
    }

    get disabledDescription(): string {
        return this._disabledDescription;
    }

    set disabledDescription(value: string) {
        this._disabledDescription = value;
    }
}
