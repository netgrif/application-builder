import {Component, Input, OnDestroy, OnInit, QueryList, TemplateRef, ViewChildren} from '@angular/core';
import {GridsterDataField} from '../classes/gridster-data-field';
import {DataType, Expression, I18nWithDynamic} from '@netgrif/petriflow';
import {DataField, EnumerationField, I18nField, MultichoiceField} from '@netgrif/components-core';
import {GridsterService} from '../gridster.service';
import {GridsterFieldToEngineFieldService} from '../../../modeler/gridster-field-to-engine-field.service';
import {Subscription} from 'rxjs';
import moment from 'moment';
import {I18nFieldValue} from '@netgrif/components-core/lib/data-fields/i18n-field/models/i18n-field-value';

@Component({
  selector: 'nab-gridster-datafield',
  templateUrl: './gridster-data-field.component.html',
  styleUrls: ['./gridster-data-field.component.scss'],
})
export class GridsterDataFieldComponent implements OnInit, OnDestroy {

  @Input() public dataField: GridsterDataField;
  @ViewChildren(TemplateRef) templates: QueryList<TemplateRef<any>>;
  DataType = DataType;
  engineField: DataField<unknown>;
  private _gridsterSubscription: Subscription;

  constructor(private _gridsterService: GridsterService, private _transformService: GridsterFieldToEngineFieldService) {
  }

  ngOnDestroy(): void {
    this._gridsterSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.engineField = this._transformService.transformDataField(this.dataField);
    this._gridsterSubscription = this._gridsterService.selectedDataFieldChangeStream.subscribe(this.updateEngineField.bind(this));
    this.engineField.valueChanges().subscribe(value => {
      if (value && value instanceof Array) {
        // TODO: NAB-337: check
        this.dataField.dataVariable.inits = value.map(init => new I18nWithDynamic(init as string));
      } else if (this.dataField.dataVariable.type === DataType.DATETIME || this.dataField.dataVariable.type === DataType.DATE) {
        // TODO: NAB-337: check
        if (value) {
          this.dataField.dataVariable.init = new I18nWithDynamic(moment(value).toISOString());
        }
      } else if (!(value instanceof Object) && value || this.dataField.dataVariable.type === DataType.BOOLEAN) {
        // TODO: NAB-337: check
        this.dataField.dataVariable.init = new I18nWithDynamic(value.toString());
      }
    });
  }

  private updateEngineField() {
    const updatedField = this._transformService.transformDataField(this.dataField);
    this.engineField.title = updatedField.title;
    this.engineField.value = updatedField.value;
    this.engineField.placeholder = updatedField.placeholder;
    this.engineField.description = updatedField.description;
    this.engineField.layout = updatedField.layout;
    this.engineField.materialAppearance = updatedField.layout.appearance;
    this.engineField.behavior.required = updatedField.behavior.required;
    this.engineField.behavior.optional = updatedField.behavior.optional;
    this.engineField.behavior.visible = updatedField.behavior.visible;
    this.engineField.behavior.editable = updatedField.behavior.editable;
    this.engineField.behavior.hidden = updatedField.behavior.hidden;
    this.engineField.component.name = updatedField.component?.name;
    this.engineField.component.properties = updatedField.component?.properties;
    this.engineField.component.optionIcons = updatedField.component?.optionIcons;
    if (this.engineField instanceof EnumerationField) {
      this.engineField.choices = (updatedField as EnumerationField).choices;
    }
    if (this.engineField instanceof MultichoiceField) {
      this.engineField.choices = (updatedField as MultichoiceField).choices;
    }
    this.engineField.update();
    // TODO this.engineField.validations
  }
}
