import {DataType} from '@netgrif/petriflow';

export class ModelerConfig {
    public static SIZE = 32;
    public static MAX_WIDTH = 10000;
    public static MAX_HEIGHT = 5000;
    public static ZOOM_SPEED = 0.2;
    public static LAYOUT_DEFAULT_COLS = 4;
    public static VARIABLE_ARC_DATA_TYPES = [DataType.TEXT, DataType.ENUMERATION, DataType.ENUMERATION_MAP, DataType.NUMBER];
    public static ARC_BREAKPOINT_OFFSET = 10;
    public static HISTORY_SIZE = 100;
    public static LOCALSTORAGE = {
        DRAFT_MODEL: {
            KEY: 'old_model',
            TIMESTAMP: 'old_model_timestamp',
            ID: 'old_model_id',
            TITLE: 'old_model_title'
        },
        PERMISSION_DIALOG: {
            ROLE_SORT: 'role_sort',
            ROLE_DIRECTION: 'role_direction',
            USER_REF_SORT: 'user_ref_sort',
            USER_REF_DIRECTION: 'user_ref_direction'
        }
    }
}
