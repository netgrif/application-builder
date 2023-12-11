import {Injectable} from '@angular/core';
import {
  AssignPolicy,
  DataField,
  DataFocusPolicy,
  DataGroup as EngineDataGroup,
  DataGroupAlignment,
  FieldAlignment,
  FieldConverterService,
  FieldTypeResource,
  FinishPolicy,
  Layout as EngineLayout,
  MaterialAppearance,
  Task,
  TemplateAppearance,
} from '@netgrif/components-core';
import {
  DataGroup,
  DataLayout,
  DataRef,
  DataRefBehavior,
  DataRefLogic,
  DataVariable,
  Transition,
} from '@netgrif/petriflow';
import {Behavior} from '@netgrif/components-core/lib/data-fields/models/behavior';

@Injectable({
  providedIn: 'root',
})
export class TransitionToTaskService {

  constructor(private _fieldConverter: FieldConverterService) {
  }

  public convertTask(t: Transition, data: Map<string, DataVariable>): Task {
    return {
      caseId: '',
      transitionId: t.id,
      title: t.label.value,
      caseColor: '',
      caseTitle: '',
      user: undefined,
      roles: {},
      users: {},
      startDate: undefined,
      finishDate: undefined,
      assignPolicy: AssignPolicy.manual,
      dataFocusPolicy: DataFocusPolicy.manual,
      finishPolicy: FinishPolicy.manual,
      stringId: '',
      layout: {
        type: 'grid' as any, // TODO any
        offset: 0,
        rows: t.layout.rows,
        cols: t.layout.cols,
      },
      dataGroups: t.dataGroups.map(group => this.convertDataGroup(group, data)),
      _links: {},
    };
  }

  public convertDataGroup(group: DataGroup, fields: Map<string, DataVariable>): EngineDataGroup {
    return {
      alignment: DataGroupAlignment.START,
      title: group.title.value,
      stretch: undefined,
      fields: group.getDataRefs().map(d => this.convertDataField(fields.get(d.id), d)),
    };
  }

  public convertDataField(data: DataVariable, ref: DataRef): DataField<any> {
    const resource = {
      stringId: data.id,
      type: data.type as string as FieldTypeResource,
      name: data.title.value,
      description: data.desc.value,
      placeholder: data.placeholder.value,
      behavior: this.convertBehavior(ref.logic),
      layout: this.convertLayout(ref.layout), // TODO:
      order: 0,
      // value: undefined, // TODO
      // defaultValue: undefined, // TODO
      options: data.options.map(o => ({[o.key]: o.value.value})).reduce((acc, val) => ({...acc, ...val}), {}),
      // validations: [] // TODO
      // component: {} // TODO
    };
    return this._fieldConverter.toClass(resource);
  }

  public convertBehavior(logic: DataRefLogic): Behavior {
    return {
      required: logic.required,
      optional: !logic.required,
      visible: logic.behavior === DataRefBehavior.VISIBLE,
      editable: logic.behavior === DataRefBehavior.EDITABLE,
      hidden: logic.behavior === DataRefBehavior.HIDDEN,
      forbidden: logic.behavior === DataRefBehavior.FORBIDDEN,
    };
  }

  public convertLayout(layout: DataLayout): EngineLayout {
    return {
      x: layout.x,
      y: layout.y,
      rows: layout.rows,
      cols: layout.cols,
      template: layout.template as string as TemplateAppearance,
      appearance: layout.appearance as string as MaterialAppearance,
      offset: layout.offset,
      alignment: layout.alignment as string as FieldAlignment,
    };
  }
}
