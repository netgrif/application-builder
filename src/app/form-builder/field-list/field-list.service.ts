import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {DataType, Property} from '@netgrif/petriflow';
import {GridsterDataField} from '../gridster/classes/gridster-data-field';

export interface PropertyDef {
    name: string;
    defaultValue: any;
}

export interface ComponentDef {
    title: string;
    name?: string;
    rows?: number;
    cols?: number;
    properties?: Array<PropertyDef>;
}

export interface DataRefDef {
    type: DataType;
    components: Array<ComponentDef>;
}

@Injectable({
    providedIn: 'root'
})
export class FieldListService {

    static DEFAULT_FIELD_COLS = 2;
    static DEFAULT_FIELD_ROWS = 1;

    fieldListArray: Array<DataRefDef> = [
        {
            type: DataType.TEXT,
            components: [
                {title: 'Simple'},
                {title: 'Area', name: 'textarea', rows: 2, cols: 4},
                {title: 'Markdown Editor', name: 'richtextarea', rows: 2, cols: 4},
                {title: 'HTML Editor', name: 'htmltextarea', rows: 2, cols: 4},
                {title: 'Password', name: 'password'},
                {title: 'Signature', name: 'signature'}
            ]
        },
        {
            type: DataType.NUMBER,
            components: [
                {title: 'Simple'},
                {title: 'Decimal', name: 'decimal'},
                {
                    title: 'Currency', name: 'currency', properties: [
                        {
                            name: 'code',
                            defaultValue: 'EUR'
                        },
                        {
                            name: 'fractionSize',
                            defaultValue: 2
                        },
                        {
                            name: 'locale',
                            defaultValue: 'sk'
                        },
                    ]
                }
            ]
        },
        {
            type: DataType.ENUMERATION,
            components: [
                {title: 'Select'},
                {title: 'List', name: 'list'},
            ]
        },
        {
            type: DataType.ENUMERATION_MAP,
            components: [
                {title: 'Select'},
                {title: 'List', name: 'list'},
                {title: 'Stepper', name: 'stepper'},
                {title: 'Autocomplete', name: 'autocomplete'},
                {title: 'Dynamic Autocomplete', name: 'autocomplete_dynamic'},
                {title: 'Icon', name: 'icon'},
                {title: 'Case ref', name: 'caseref'}
            ]
        },
        {
            type: DataType.MULTICHOICE,
            components: [
                {title: 'Select'},
                {title: 'List', name: 'list'}
            ]
        },
        {
            type: DataType.MULTICHOICE_MAP,
            components: [
                {title: 'Select'},
                {title: 'List', name: 'list'},
                {title: 'Autocomplete', name: 'autocomplete'},
                {title: 'Case ref', name: 'caseref'}
            ]
        },
        {
            type: DataType.BOOLEAN,
            components: [
                {title: 'Slide'}
            ]
        },
        {
            type: DataType.BUTTON,
            components: [
                {title: 'Simple'},
                {title: 'Raised', name: 'raised'},
                {title: 'Stroked', name: 'stroked'},
                {title: 'Flat', name: 'flat'},
                {title: 'Icon', name: 'icon'},
                {title: 'FAB', name: 'fab'},
                {title: 'MiniFAB', name: 'minifab'}
            ]
        },
        {
            type: DataType.DATE,
            components: [
                {title: 'Simple'}
            ]
        },
        {
            type: DataType.DATETIME,
            components: [
                {title: 'Simple'}
            ]
        },
        {
            type: DataType.FILE,
            components: [
                {title: 'Simple'},
                {title: 'Preview', name: 'preview'}
            ]
        },
        {
            type: DataType.FILE_LIST,
            components: [
                {title: 'Simple'}
            ]
        },
        {
            type: DataType.USER,
            components: [
                {title: 'Simple'}
            ]
        },
        {
            type: DataType.USER_LIST,
            components: [
                {title: 'Simple'}
            ]
        },
        {
            type: DataType.FILTER,
            components: [
                {title: 'Simple'},
                {title: 'Tab view', name: 'filter-tab-view'}
            ]
        },
        {
            type: DataType.I18N,
            components: [
                {title: 'Simple'},
                {title: 'Divider', name: 'divider', cols: 4}
            ]
        },
        {
            type: DataType.TASK_REF,
            components: [
                {title: 'Simple', cols: 4},
                {title: 'Dashboard', name: 'dashboard', cols: 4}
            ]
        },
        {
            type: DataType.CASE_REF,
            components: [
                {title: 'Simple'}
            ]
        },
        {
            type: 'stringCollection' as DataType,
            components: [
                {title: 'Simple'}
            ]
        }
    ];

    public draggedObjectsStream: Subject<GridsterDataField>;

    constructor() {
        this.draggedObjectsStream = new Subject();
    }

    public getComponentMeta(type: DataType, componentName: string): ComponentDef {
        const meta = {
            rows: FieldListService.DEFAULT_FIELD_ROWS,
            cols: FieldListService.DEFAULT_FIELD_COLS,
            name: componentName
        } as ComponentDef;
        if (type === undefined || componentName === undefined) {
            return meta;
        }
        const fieldTypeObject = this.fieldListArray.find(it => it.type === type);
        if (!fieldTypeObject) {
            return meta;
        }
        const componentObject = fieldTypeObject?.components?.find(it => it.name === componentName);
        if (!componentObject) {
            return meta;
        }
        if (componentObject.rows) {
            meta.rows = componentObject.rows;
        }
        if (componentObject.cols) {
            meta.cols = componentObject.cols;
        }
        return meta;
    }
}
