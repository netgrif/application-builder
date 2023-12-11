import {Injectable} from '@angular/core';
import {CompactType, DisplayGrid, GridsterConfig, GridsterItem, GridType} from 'angular-gridster2';
import {ModelService} from '../../modeler/services/model.service';
import {GridsterDataField} from './classes/gridster-data-field';
import {
  Appearance,
  Component,
  DataGroup,
  DataRef,
  DataRefBehavior,
  DataType,
  DataVariable,
  Expression, I18nWithDynamic,
  LayoutType,
  Template,
  Transition,
  TransitionLayout,
} from '@netgrif/petriflow';
import {BehaviorSubject, ReplaySubject, Subject} from 'rxjs';
import {GridsterItemComponentInterface} from 'angular-gridster2/lib/gridsterItemComponent.interface';
import {DataFieldUtils} from '../data-field-utils';
import {SelectedTransitionService} from '../../modeler/selected-transition.service';
import {FieldListService} from '../field-list/field-list.service';
import {ModelerConfig} from '../../modeler/modeler-config';
import {debounceTime} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GridsterService {
  public static readonly EXISTING_FIELD = 'existingField';

  options: GridsterConfig;
  mapCounter: Map<string, number>;
  placedDataFields: Array<GridsterDataField>;
  selectedDataField: GridsterDataField;
  selectedDataFieldStream: ReplaySubject<GridsterDataField>;
  selectedDataFieldChangeStream: BehaviorSubject<void>;
  onNewFieldPlaced: ReplaySubject<DataVariable>;
  optionChanged: Subject<void>;

  constructor(private modelService: ModelService, private transitionService: SelectedTransitionService) {
    this.options = {
      gridType: GridType.VerticalFixed,
      compactType: CompactType.None,
      margin: 0,
      useTransformPositioning: true,
      mobileBreakpoint: 640,
      minCols: ModelerConfig.LAYOUT_DEFAULT_COLS,
      maxCols: ModelerConfig.LAYOUT_DEFAULT_COLS,
      minRows: 1,
      maxRows: 1000,
      maxItemCols: ModelerConfig.LAYOUT_DEFAULT_COLS,
      minItemCols: 1,
      maxItemRows: 10,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 1,
      defaultItemRows: 1,
      fixedColWidth: 105,
      fixedRowHeight: 110,
      keepFixedHeightInMobile: false,
      keepFixedWidthInMobile: false,
      scrollSensitivity: 10,
      scrollSpeed: 20,
      enableEmptyCellClick: false,
      enableEmptyCellContextMenu: false,
      enableEmptyCellDrag: false,
      enableOccupiedCellDrop: false,
      emptyCellDragMaxCols: ModelerConfig.LAYOUT_DEFAULT_COLS,
      emptyCellDragMaxRows: 50,
      ignoreMarginInRow: false,
      draggable: {
        enabled: true,
      },
      resizable: {
        enabled: true,
      },
      swap: false,
      pushItems: true,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      pushDirections: {north: true, east: true, south: true, west: true},
      pushResizeItems: false,
      displayGrid: DisplayGrid.Always,
      disableWindowResize: false,
      disableWarnings: false,
      scrollToNewItems: false,
      emptyCellDropCallback: this.emptyCellClick.bind(this),
      emptyCellDragCallback: this.emptyCellClick.bind(this),
      itemResizeCallback: this.updateDataRef.bind(this),
      itemChangeCallback: this.updateDataRef.bind(this),
      enableEmptyCellDrop: true,
      ignoreContent: true,
      ignoreContentClass: 'gridster-item-content',
      dragHandleClass: 'drag-handler',
    };
    this.placedDataFields = new Array<GridsterDataField>();
    this.mapCounter = new Map<string, number>();
    this.selectedDataFieldChangeStream = new BehaviorSubject<void>(undefined);
    this.onNewFieldPlaced = new ReplaySubject();
    this.selectedDataFieldStream = new ReplaySubject();
    this.optionChanged = new Subject<void>();
    this.optionChanged.pipe(debounceTime(300)).subscribe(() => {
      this.options?.api?.optionsChanged();
    });
  }

  get transition(): Transition {
    const transition = this.modelService.model.getTransition(this.transitionId);
    if (!transition.layout) {
      transition.layout = new TransitionLayout();
    }
    return transition;
  }

  get transitionId(): string {
    return this.transitionService.id;
  }

  emptyCellClick(event: DragEvent, item: GridsterItem) {
    if (!event?.dataTransfer?.getData('type') && !event?.dataTransfer?.getData(GridsterService.EXISTING_FIELD)) {
      return;
    }
    const isExistingField = event.dataTransfer.getData(GridsterService.EXISTING_FIELD) === 'true';
    let dataVariable: DataVariable;
    if (!isExistingField) {
      dataVariable = this.addNewDataVariable(event.dataTransfer.getData('type') as DataType);
    } else {
      const id = event.dataTransfer.getData('id');
      dataVariable = this.modelService.model.getData(id);
    }
    this.addNewDataRef(dataVariable, event, item);
  }

  updateDataRef(item: GridsterDataField, resized: GridsterItemComponentInterface) {
    item.x = item.dataRef.layout.x = resized.$item.x;
    item.y = item.dataRef.layout.y = resized.$item.y;
    item.rows = item.dataRef.layout.rows = resized.$item.rows;
    item.cols = item.dataRef.layout.cols = resized.$item.cols;
    this.updateGridsterRows();
  }

  updatePlacedDataFields() {
    const refs = this.transition.dataGroups[0]?.getDataRefs();
    if (refs) {
      this.placedDataFields = refs.map(ref => new GridsterDataField(ref, this.modelService.model.getData(ref.id)));
    } else {
      this.placedDataFields = [];
    }
  }

  updateGridsterRows() {
    let min = 1;
    this.placedDataFields.forEach(ref => {
      const end = ref.y + ref.rows;
      if (end > min) {
        min = end;
      }
    });
    this.options.minRows = min + 1;
    this.optionChanged.next();
  }

  removeDataRef(item: GridsterDataField) {
    const id = item.dataRef.id;
    (this.transition.dataGroups[0] as DataGroup).removeDataRef(id);
    this.placedDataFields.splice(this.placedDataFields.findIndex(field => field.dataVariable.id === id), 1);
    this.selectedDataField = undefined;
    this.selectedDataFieldStream.next(this.selectedDataField);
  }

  public addNewDataVariable(type: DataType): DataVariable {
    const id = this.createId(type);
    const dataVariable = new DataVariable(id, type);
    if (DataFieldUtils.FIELDS_WITH_OPTIONS.includes(type)) {
      dataVariable.optionsInit = new Expression('', true);
      if (DataFieldUtils.FIELDS_WITH_INITS.includes(type)) {
        dataVariable.inits = [];
      }
    } else {
      // TODO: NAB-337: check
      dataVariable.init = new I18nWithDynamic('', '', false);
    }
    this.modelService.model.addData(dataVariable);
    return dataVariable;
  }

  public addDataRef(dataVariable: DataVariable, componentRows: number, componentCols: number, componentName: string, item: GridsterItem) {
    const dataRef = new DataRef(dataVariable.id);
    dataRef.layout.x = item.x;
    dataRef.layout.y = item.y;
    item.rows = FieldListService.DEFAULT_FIELD_ROWS;
    item.cols = FieldListService.DEFAULT_FIELD_COLS;
    if (componentRows) {
      item.rows = +componentRows;
    }
    if (componentCols) {
      item.cols = +componentCols;
    }
    if (item.cols > this.options.maxCols) {
      item.cols = this.options.maxCols;
    }
    dataRef.layout.rows = item.rows;
    dataRef.layout.cols = item.cols;
    dataRef.layout.template = Template.MATERIAL;
    dataRef.layout.appearance = Appearance.OUTLINE;
    dataRef.logic.behavior = DataRefBehavior.EDITABLE;

    if (componentName) {
      dataRef.component = new Component(componentName);
    }
    const transition = this.modelService.model.getTransition(this.transitionId);
    if (transition.dataGroups.length === 0) {
      const dataGroup = new DataGroup(`${transition.id}_0`);
      dataGroup.layout = LayoutType.GRID;
      dataGroup.cols = this.options.minCols;
      transition.dataGroups.push(dataGroup);
    }
    transition.dataGroups[0].addDataRef(dataRef);
    if (dataVariable.type === DataType.TASK_REF && dataVariable.init?.value === this.transitionId) {
      dataVariable.init.value = undefined;
    }
    this.selectedDataField = new GridsterDataField(dataRef, dataVariable);
    this.selectedDataFieldStream.next(this.selectedDataField);
    this.placedDataFields.push(this.selectedDataField);
    this.onNewFieldPlaced.next(dataVariable);
    this.updateGridsterRows();
    return dataRef;
  }

  private addNewDataRef(data: DataVariable, event: DragEvent, item: GridsterItem): DataRef {
    return this.addDataRef(
      data,
      +event.dataTransfer.getData('rows'),
      +event.dataTransfer.getData('cols'),
      event.dataTransfer.getData('ref_component'),
      item);
  }

  private createId(type: string) {
    let counter: number;
    if (this.mapCounter.has(type)) {
      counter = this.mapCounter.get(type);
      this.mapCounter.set(type, counter + 1);
    } else {
      counter = 0;
      this.mapCounter.set(type, counter + 1);
    }
    try {
      if (this.modelService.model.getData(type + '_' + counter)) {
        return this.createId(type);
      } else {
        return type + '_' + counter;
      }
    } catch (e) {
      return type + '_' + counter;
    }
  }
}
