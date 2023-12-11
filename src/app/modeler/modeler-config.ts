import {DataType, LayoutType} from '@netgrif/petriflow';

export class ModelerConfig {
  public static VERTICAL_OFFSET = 60;
  public static HORIZONTAL_OFFSET = 63;
  public static RADIUS = 18;
  public static SIZE = 36;
  public static ICON_SIZE = 25;
  public static TOKEN_RADIUS = 3;
  public static TOKEN_OFFSET = 7;
  public static MAX_WIDTH = 10000;
  public static MAX_HEIGHT = 5000;
  public static MIN_WIDTH = 640;
  public static MIN_HEIGHT = 360;
  public static ARROW_HEAD_SIZE = 9;
  public static FONTSIZE_OFFSET = 18;
  public static FONT_SIZE = 12;
  public static COORDINATES_OFFSET = 20;
  public static MAX_X: number = ModelerConfig.MAX_WIDTH - ModelerConfig.COORDINATES_OFFSET;
  public static MAX_Y: number = ModelerConfig.MAX_HEIGHT - ModelerConfig.COORDINATES_OFFSET;
  public static GRID_STEP: number = 2 * ModelerConfig.COORDINATES_OFFSET;
  public static INITIALISE_PLACE = true;
  public static LAYOUT_DEFAULT_TYPE = LayoutType.GRID;
  public static LAYOUT_DEFAULT_COLS = 4;
  public static VARIABLE_ARC_DATA_TYPES = [DataType.TEXT, DataType.ENUMERATION, DataType.ENUMERATION_MAP, DataType.NUMBER];
}
