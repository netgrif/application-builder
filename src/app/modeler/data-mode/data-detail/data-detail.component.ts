import {Component, OnDestroy} from '@angular/core';
import {DataMasterDetailService} from '../data-master-detail.service';
import {
    Component as PetriflowComponent,
    DataType,
    DataVariable, Expression, I18nString,
    I18nWithDynamic,
    Option,
    Property,
    Validation
} from '@netgrif/petriflow';
import {MatDialog} from '@angular/material/dialog';
import {DialogRefactorComponent} from '../../../dialogs/dialog-refactor/dialog-refactor.component';
import {FormControl} from '@angular/forms';
import {DataFieldUtils} from '../../../form-builder/data-field-utils';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {EnumerationFieldValue} from '@netgrif/components-core';
import {ModelService} from '../../services/model/model.service';
import {Router} from '@angular/router';
import {ActionsModeService} from '../../actions-mode/actions-mode.service';
import {ActionsMasterDetailService} from '../../actions-mode/actions-master-detail.setvice';
import {HistoryService} from '../../services/history/history.service';
import {Observable} from 'rxjs';
import {map, startWith, tap} from 'rxjs/operators';

export interface TypeArray {
    viewValue: string;
    value: string;
}

export interface HistoryDataSave {
    item: DataVariable,
    save: boolean;
}

@Component({
    selector: 'nab-data-detail',
    templateUrl: './data-detail.component.html',
    styleUrl: './data-detail.component.scss'
})
export class DataDetailComponent implements OnDestroy {

    counterEnumMap = 0;
    formControlRef: FormControl;
    transitionOptions: Array<EnumerationFieldValue>;
    filteredOptions: Observable<Array<EnumerationFieldValue>>;
    typeArray: Array<TypeArray> = [
        {viewValue: 'Boolean', value: DataType.BOOLEAN},
        {viewValue: 'Button', value: DataType.BUTTON},
        {viewValue: 'Case Ref', value: DataType.CASE_REF},
        {viewValue: 'Date', value: DataType.DATE},
        {viewValue: 'Datetime', value: DataType.DATETIME},
        {viewValue: 'Enumeration', value: DataType.ENUMERATION},
        {viewValue: 'Enumeration Map', value: DataType.ENUMERATION_MAP},
        {viewValue: 'File', value: DataType.FILE},
        {viewValue: 'File List', value: DataType.FILE_LIST},
        {viewValue: 'Filter', value: DataType.FILTER},
        {viewValue: 'I18n', value: DataType.I18N},
        {viewValue: 'Multichoice', value: DataType.MULTICHOICE},
        {viewValue: 'Multichoice Map', value: DataType.MULTICHOICE_MAP},
        {viewValue: 'Number', value: DataType.NUMBER},
        {viewValue: 'User', value: DataType.USER},
        {viewValue: 'User List', value: DataType.USER_LIST},
        {viewValue: 'String Collection', value: 'stringCollection'},
        {viewValue: 'Task Ref', value: DataType.TASK_REF},
        {viewValue: 'Text', value: DataType.TEXT}
    ];
    historyDataSave: HistoryDataSave;

    public constructor(
        private _masterService: DataMasterDetailService,
        private _modelService: ModelService,
        private dialog: MatDialog,
        private _router: Router,
        private _actionMode: ActionsModeService,
        private _actionsMasterDetail: ActionsMasterDetailService,
        private _historyService: HistoryService
    ) {
        this.formControlRef = new FormControl();
        this.transitionOptions = this.createTransOptions();
        this._masterService.getSelected$().subscribe(obj => {
            if (this.historyDataSave?.save) {
                this._historyService.save(`DataVariable ${this.historyDataSave.item.id} has been changed.`);
            }
            if (obj) {
                if (!obj.init) {
                    obj.init = new I18nWithDynamic('');
                }
                this.formControlRef.patchValue(obj.init.value);
                this.historyDataSave = {
                    item: obj,
                    save: false
                }
            }
        });
        this.filteredOptions = this.formControlRef.valueChanges.pipe(
            tap(value => {
                if (value === '' || value === undefined) {
                    if (!this._modelService.model.getData(this.item.id).init) {
                        this._modelService.model.getData(this.item.id).init = new I18nWithDynamic(value);
                    } else {
                        this._modelService.model.getData(this.item.id).init.value = value;
                    }
                    // const data = this._service.masterData.find(obj => obj.id === this.selectedItem.id);
                    // if (!data.init) {
                    //     data.init = new Expression(value);
                    // } else {
                    //     data.init.expression = value;
                    // }
                }
            }),
            startWith(''),
            map(value => this._filter(value))
        );
    }

    ngOnDestroy() {
        if (this.historyDataSave?.save) {
            this._historyService.save(`DataVariable ${this.historyDataSave.item.id} has been changed.`);
        }
    }

    createTransOptions() {
        return this._modelService.model.getTransitions().map(trans => ({
            key: trans.id,
            value: trans.label?.value ?? ''
        }));
    }

    openRefactorDialog(): void {
        const dialogRef = this.dialog.open(DialogRefactorComponent, {
            width: '50%',
            panelClass: "dialog-width-50",
            data: {originalId: this.item.id}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                this._historyService.save(`DataVariable ${this.item.id} ID has been changed to ${result} ${this.historyDataSave.save ? ', and has been changed' : ''}.`);
                this.historyDataSave.save = false;
                this.item.id = result;
            }
        });
    }

    setValue($event, variable: string, index?: number): void {
        switch (variable) {
            case 'id': {
                this.item.id = $event.target.value;
                break;
            }
            case 'name': {
                this.item.title.value = $event.target.value;
                break;
            }
            case 'value': {
                this.item.init = $event.target.value;
                break;
            }
            case 'type': {
                this.removeSpecificAttributeOnChange();
                this.item.type = ($event.value as DataType);
                break;
            }
            case 'immediate': {
                this.item.immediate = $event.checked;
                break;
            }
            case 'desc': {
                this.item.desc.value = $event.target.value;
                break;
            }
            case 'placeholder': {
                this.item.placeholder.value = $event.target.value;
                break;
            }
            case 'init': {
                const value = $event.target.value;
                if (this.item.init === undefined) {
                    this.item.init = new I18nWithDynamic(value);
                } else {
                    this.item.init.value = value;
                }
                break;
            }
            case 'dynamic-init': {
                const value = $event.source.checked;
                if (this.item.init === undefined) {
                    this.item.init = new I18nWithDynamic(value);
                } else {
                    this.item.init.dynamic = value;
                }
                break;
            }
            case 'options-key': {
                this.item.options[index].key = $event.target.value;
                break;
            }
            case 'options-value': {
                this.item.options[index].value.value = $event.target.value;
                if (this.hasSimpleOptions()) {
                    this.setValue($event, 'options-key', index);
                }
                break;
            }
            case 'component-name': {
                this.item.component.name = $event.target.value;
                break;
            }
            case 'encryption': {
                this.item.encryption = $event.target.value;
                break;
            }
            case 'options-init': {
                this.item.optionsInit.expression = $event.target.value;
                break;
            }
            case 'options-init-dynamic': {
                this.item.optionsInit.dynamic = $event.target.value;
                break;
            }
            case 'allowedNets': {
                this.item.allowedNets[index] = $event.target.value;
                break;
            }
            case 'property_key': {
                this.item.component.properties[index].key = $event.target.value as string;
                break;
            }
            case 'property_value': {
                this.item.component.properties[index].value = $event.target.value as string;
                break;
            }
        }
        this.historyDataSave.save = true;
    }

    removeSpecificAttributeOnChange() {
        this.item.inits = [];
        this.item.init.value = '';
        this.item.options = [];
    }

    createOrDelete() {
        if (this.item.component === undefined) {
            this.item.component = new PetriflowComponent('');
        } else {
            this.item.component = undefined;
        }
        this.historyDataSave.save = true;
    }

    deleteProperty(index: number) {
        this.item.component.properties.splice(index, 1);
        this.historyDataSave.save = true;
    }

    addProperty() {
        this.item.component.properties.push(new Property('', ''));
        this.historyDataSave.save = true;
    }

    changeInitsValue(inits: Array<string>) {
        this.item.inits = inits.map(initKey => new I18nWithDynamic(initKey));
        this.historyDataSave.save = true;
    }

    deleteAllowedNet(index: number) {
        this.item.allowedNets.splice(index, 1);
        this.historyDataSave.save = true;
    }

    addAllowedNet() {
        this.item.allowedNets.push('');
        this.historyDataSave.save = true;
    }

    addValidation(): void {
        const validation = new Validation();
        validation.expression = new Expression('', false);
        validation.message = new I18nString('');
        this.item.validations.push(validation);
        this.historyDataSave.save = true;
    }

    deleteValidation(index: number): void {
        this.item.validations.splice(index, 1);
        this.historyDataSave.save = true;
    }

    addOption() {
        this.item.options.push(new Option(this.createKeyId(), new I18nString('value')));
        this.historyDataSave.save = true;
    }

    dropOption(event: CdkDragDrop<Array<string>>) {
        moveItemInArray(this.item.options, event.previousIndex, event.currentIndex);
        this.historyDataSave.save = true;
    }

    deleteOption(index: number) {
        this.item.options.splice(index, 1);
        this.historyDataSave.save = true;
    }

    getInitsValue(): Array<string> {
        return this.item.inits.map(initKey => initKey.value);
    }

    getItemOptionsInitExpression(): string {
        return this.item.optionsInit?.expression ?? '';
    }

    getItemOptionsInitDynamic(): boolean {
        return !!this.item.optionsInit?.dynamic;
    }

    hasSimpleOptions(): boolean {
        return [DataType.ENUMERATION, DataType.MULTICHOICE].includes(this.item.type);
    }

    hasInits(): boolean {
        return DataFieldUtils.FIELDS_WITH_INITS.includes(this.item.type);
    }

    isItemInitDynamic(): boolean {
        return !!this.item.init?.dynamic;
    }

    isOptionField(): boolean {
        return [DataType.ENUMERATION, DataType.ENUMERATION_MAP, DataType.MULTICHOICE, DataType.MULTICHOICE_MAP].includes(this.item.type);
    }

    createKeyId(): string {
        this.counterEnumMap++;
        if (this.item.options.find(item => item.key === 'key' + this.counterEnumMap)) {
            return this.createKeyId();
        } else {
            return 'key' + String(this.counterEnumMap);
        }
    }

    _filter(value: string): Array<EnumerationFieldValue> {
        const filterValue = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        return this.transitionOptions.filter(option => option.value.toLowerCase().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').indexOf(filterValue) === 0);
    }

    get item(): DataVariable {
        return this.service.getSelected();
    }

    get service(): DataMasterDetailService {
        return this._masterService;
    }

    openActions() {
        this._actionMode.activate(this._actionMode.dataActionsTool);
        this._actionsMasterDetail.select(this._masterService.getSelected());
        this._router.navigate(['modeler/actions']);
    }
}
