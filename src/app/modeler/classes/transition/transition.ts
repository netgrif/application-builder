import {DataVariable, Transition as PetriflowTransition} from '@netgrif/petriflow';
import {GridsterDataField} from '../../../form-builder/gridster/classes/gridster-data-field';
import {Activable} from '../activable';
import {SvgTransition} from './svg-transition';

export class Transition implements Activable {

  public transition: PetriflowTransition;
  public over: number;
  public objektyelementu: SvgTransition;
  public firing: boolean;
  public data: Array<GridsterDataField>;

  constructor(transition: PetriflowTransition, processData: Array<DataVariable>) {
    this.transition = transition;
    this.data = [];
    this.resolveDataGridObjects(transition, processData);
    this.over = 1;
  }

  set stringX(value: string) {
    this.transition.x = +value;
  }

  set stringY(value: string) {
    this.transition.y = +value;
  }

  get numCols() {
    return this.transition.layout?.cols === undefined ? 4 : this.transition.layout.cols;
  }

  public getLabelOrId(): string {
    if (this.transition.label !== undefined && this.transition.label.value !== undefined && this.transition.label.value !== '') {
      return this.transition.label.value;
    } else {
      return this.transition.id;
    }
  }

  public activate(): void {
    if (this.objektyelementu !== undefined) {
      this.objektyelementu.element.setAttributeNS(null, 'class', 'svg-active-stroke');
      this.objektyelementu.menoelem.setAttributeNS(null, 'class', 'svg-active-fill');
    }
    this.over = 1;
  }

  public deactivate(): void {
    if (this.objektyelementu !== undefined) {
      this.objektyelementu.element.setAttributeNS(null, 'class', 'svg-inactive-stroke');
      this.objektyelementu.element.setAttributeNS(null, 'fill', 'white');
      this.objektyelementu.element.setAttributeNS(null, 'stroke-width', '2');
      this.objektyelementu.menoelem.setAttributeNS(null, 'class', 'svg-inactive-fill');
    }
    this.over = 0;
  }

  public enable(): void {
    if (this.objektyelementu !== undefined) {
      if (this.firing) {
        this.objektyelementu.element.setAttributeNS(null, 'class', 'svg-transition-firing');
        this.objektyelementu.cancelArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-cancel-active');
        this.objektyelementu.finishArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-finish-active');
        this.objektyelementu.icon?.setAttributeNS(null, 'class', 'svg-icon-inactive');
      } else {
        this.objektyelementu.element.setAttributeNS(null, 'class', 'svg-transition-enabled');
        this.objektyelementu.cancelArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-cancel-inactive');
        this.objektyelementu.finishArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-finish-inactive');
        this.objektyelementu.icon?.setAttributeNS(null, 'class', 'svg-icon-active');
      }
    }
  }

  public disable(): void {
    if (this.objektyelementu !== undefined) {
      this.objektyelementu.element.setAttributeNS(null, 'class', 'svg-transition-disabled');
      if (this.firing) {
        this.objektyelementu.cancelArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-cancel-active');
        this.objektyelementu.finishArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-finish-active');
        this.objektyelementu.icon?.setAttributeNS(null, 'class', 'svg-icon-inactive');
      } else {
        this.objektyelementu.cancelArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-cancel-inactive');
        this.objektyelementu.finishArrow.setAttributeNS(null, 'class', 'svg-fire-arrow-finish-inactive');
        this.objektyelementu.icon?.setAttributeNS(null, 'class', 'svg-icon-active');
      }
    }
  }

  protected resolveDataGridObjects(transition: PetriflowTransition, processData: Array<DataVariable>) {
    const dataFieldMap = new Map<string, DataVariable>();
    processData.forEach(dataField => dataFieldMap.set(dataField.id, dataField));
    if (transition.dataGroups.length > 0) {
      let rowIndex = 0;
      transition.dataGroups.forEach(dataGroup => {
        let columnIndex = 0;
        const width = transition.layout?.cols !== undefined ? transition.layout.cols : 4;
        const cols = dataGroup.stretch ? width : Math.floor(width / 2);
        for (const dataRef of dataGroup.getDataRefs()) {
          if (!dataFieldMap.has(dataRef.id)) {
            console.error('Datafield with id ' + dataRef.id + 'doesn\'t exist!');
            continue;
          }
          this.createGridsterObject(dataFieldMap, dataRef, columnIndex, rowIndex, cols);
          columnIndex = columnIndex + cols;
          if (columnIndex >= width) {
            columnIndex = 0;
            rowIndex++;
          }
        }
        if (columnIndex !== 0) {
          rowIndex++;
        }
      });
    }
  }

  protected createGridsterObject(dataFieldMap, dataRef, x, y, cols) {
    // TOOD
    // const gridster = DatafieldTransformer.createGridsterWrapperObject(dataFieldMap.get(dataRef.id), dataRef, x, y, cols);
    // if (gridster !== null && gridster.dataField !== undefined) {
    //     this.data.push(gridster);
    // }
  }
}
