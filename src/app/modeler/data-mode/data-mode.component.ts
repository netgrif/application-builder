import {Component, ViewChild} from '@angular/core';
import {ModelService} from '../services/model.service';
import {DataModeService} from './data-mode.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {DialogDeleteComponent} from '../../dialogs/dialog-delete/dialog-delete.component';
import {MatDialog} from '@angular/material/dialog';
import {MatSort, Sort} from '@angular/material/sort';
import {DialogRefactorComponent} from '../../dialogs/dialog-refactor/dialog-refactor.component';
import {EnumerationFieldValue} from '@netgrif/components-core';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {map, startWith, tap} from 'rxjs/operators';
import {
    Component as PetriflowComponent,
    DataType,
    DataVariable,
    Expression,
    I18nString, I18nWithDynamic,
    Option,
    PetriNet as PetriflowPetriNet,
    Property,
    Validation
} from '@netgrif/petriflow';
import {PetriNet} from '../classes/petri-net';
import {DataFieldUtils} from '../../form-builder/data-field-utils';

export interface TypeArray {
    viewValue: string;
    value: string;
}

@Component({
    selector: 'nab-data-mode',
    templateUrl: './data-mode.component.html',
    styleUrls: ['./data-mode.component.scss']
})
export class DataModeComponent {
    dataSource: Array<DataVariable>;
    length: number;
    pageSize: number;
    pageIndex: number;
    pageSizeOptions: Array<number> = [10, 20, 50, 100];
    counter: number;
    counterEnum: number;
    counterEnumMap: number;
    optionCounter: number;
    clicked = 0;
    selected: DataVariable;
    transitionOptions: Array<EnumerationFieldValue>;
    filteredOptions: Observable<Array<EnumerationFieldValue>>;
    formControlRef: FormControl;

    itemData: DataVariable;
    processData: Array<DataVariable>;

    typeArray: Array<TypeArray> = [
        {viewValue: 'Text', value: 'text'},
        {viewValue: 'Number', value: 'number'},
        {viewValue: 'Enumeration', value: 'enumeration'},
        {viewValue: 'Enumeration Map', value: 'enumeration_map'},
        {viewValue: 'Multichoice', value: 'multichoice'},
        {viewValue: 'Multichoice Map', value: 'multichoice_map'},
        {viewValue: 'Button', value: 'button'},
        {viewValue: 'File', value: 'file'},
        {viewValue: 'File List', value: 'fileList'},
        {viewValue: 'Boolean', value: 'boolean'},
        {viewValue: 'Date', value: 'date'},
        {viewValue: 'Datetime', value: 'dateTime'},
        {viewValue: 'User', value: 'user'},
        {viewValue: 'User List', value: 'userList'},
        {viewValue: 'Filter', value: 'filter'},
        {viewValue: 'I18n', value: 'i18n'},
        {viewValue: 'Task Ref', value: 'taskRef'},
        {viewValue: 'Case Ref', value: 'caseRef'}
    ];

    @ViewChild(MatSort, {static: true}) sort: MatSort;

    constructor(private modelService: ModelService, private dataService: DataModeService, private dialog: MatDialog) {
        setTimeout(() => {
            if (this.modelService.model === undefined) {
                this.modelService.model = new PetriflowPetriNet();
                this.modelService.graphicModel = new PetriNet(this.modelService.model);
            }
            this.dataService.event.next();
        });
        this.formControlRef = new FormControl();
        this.dataService.event.subscribe(() => {
            this.pageSize = 20;
            this.pageIndex = 0;
            this.processData = this.modelService.model.getDataSet();
            this.length = this.processData.length;
            this.dataSource = [...this.processData.slice(0, this.pageSize)];
            this.counter = 0;
            this.counterEnum = 0;
            this.counterEnumMap = 0;
            if (this.sort) {
                this.sort.direction = '';
            }
        });
        this.dataService.itemData.subscribe(obj => {
            this.itemData = obj;
            if (!this.itemData.init) {
                // TODO: NAB-337: check
                this.itemData.init = new I18nWithDynamic('');
            }
            this.formControlRef.patchValue(this.itemData.init.value);
        });
        this.transitionOptions = this.createTransOptions();
        this.filteredOptions = this.formControlRef.valueChanges.pipe(
            tap(value => {
                if (value === '' || value === undefined) {
                    if (!this.modelService.model.getData(this.itemData.id).init) {
                        // TODO: NAB-337: check
                        this.modelService.model.getData(this.itemData.id).init = new I18nWithDynamic(value);
                    } else {
                        this.modelService.model.getData(this.itemData.id).init.value = value;
                    }
                    const data = this.processData.find(obj => obj.id === this.itemData.id);
                    if (!data.init) {
                        // TODO: NAB-337: check
                        data.init = new I18nWithDynamic(value);
                    } else {
                        data.init.value = value;
                    }
                }
            }),
            startWith(''),
            map(value => this._filter(value))
        );
    }

    onPageChanged(e) {
        this.pageIndex = e.pageIndex;
        this.pageSize = e.pageSize;
        const firstCut = e.pageIndex * e.pageSize;
        const secondCut = firstCut + e.pageSize;
        this.dataSource = this.processData.slice(firstCut, secondCut);
    }

    setData(item: DataVariable) {
        this.clicked = 1;
        this.optionCounter = 1;
        this.selected = item;
        this.dataService.itemData.next(item);
    }

    addDataVariable() {
        const data = new DataVariable(this.createId(), DataType.TEXT);
        this.processDataVariableInsert(data);
    }

    duplicateDataVariable(event, item) {
        event.stopPropagation();
        const data = item.clone();
        data.id = this.createId();
        this.processDataVariableInsert(data);
        this.setData(data);
    }

    processDataVariableInsert(data) {
        this.modelService.model.addData(data);
        this.processData.push(data);
        this.dataSource.push(data);
        this.length = this.processData.length;
        this.pageIndex = Math.ceil(this.processData.length / this.pageSize) - 1;
        this.onCRUDChange();
        this.setData(data);
    }

    private createId() {
        this.counter++;
        if (this.modelService.model.getData('newVariable_' + this.counter)) {
            return this.createId();
        } else {
            return 'newVariable_' + String(this.counter);
        }
    }

    removeDataVariable(item: DataVariable) {
        if (item.type === DataType.USER_LIST) {
            if (this.modelService.model.getUserRef(item.id)) {
                this.modelService.model.removeUserRef(item.id);
            }
        }
        this.modelService.model.getTransitions().forEach(t => {
            t.dataGroups.forEach(dg => {
                if (dg.getDataRef(item.id)) {
                    dg.removeDataRef(item.id);
                }
            });
            if (item.type === DataType.USER_LIST && t.userRefs) {
                t.userRefs = t.userRefs.filter(ref => ref.id !== item.id);
            }
        });
        this.modelService.model.getArcs().forEach(a => {
            if (a.reference === item.id) {
                a.reference = undefined;
                a.multiplicity = 1;
            }
        });
        this.modelService.model.removeData(item.id);
        this.processData = this.modelService.model.getDataSet();
        this.length = this.modelService.model.getDataSet().length;
        this.clicked = 0;
        this.onCRUDChange();
    }

    onCRUDChange() {
        const firstCut = this.pageIndex * this.pageSize;
        const secondCut = firstCut + this.pageSize;
        this.dataSource = this.processData.slice(firstCut, secondCut);
    }

    addValidation(): void {
        const validation = new Validation();
        validation.expression = new Expression('', false);
        validation.message = new I18nString('');
        this.itemData.validations.push(validation);
    }

    deleteValidation(index: number): void {
        this.itemData.validations.splice(index, 1);
    }

    setValue($event, item: DataVariable, variable: string, index?: number) {
        const dataVariable = this.modelService.model.getData(item.id);
        switch (variable) {
            case 'id': {
                dataVariable.id = $event.target.value;
                this.processData.find(obj => obj.id === item.id).id = $event.target.value;
                break;
            }
            case 'name': {
                dataVariable.title.value = $event.target.value;
                this.processData.find(obj => obj.id === item.id).title.value = $event.target.value;
                break;
            }
            case 'value': {
                dataVariable.init = $event.target.value;
                this.processData.find(obj => obj.id === item.id).init = $event.target.value;
                break;
            }
            case 'type': {
                // TODO: remove any type-specific attributes from data field (eg. options)
                this.removeSpecificAttributeOnChange();
                dataVariable.type = $event.value;
                this.processData.find(obj => obj.id === item.id).type = $event.value;
                break;
            }
            case 'immediate': {
                dataVariable.immediate = $event.checked;
                this.processData.find(obj => obj.id === item.id).immediate = $event.checked;
                break;
            }
            case 'desc': {
                dataVariable.desc.value = $event.target.value;
                this.processData.find(obj => obj.id === item.id).desc.value = $event.target.value;
                break;
            }
            case 'placeholder': {
                dataVariable.placeholder.value = $event.target.value;
                this.processData.find(obj => obj.id === item.id).placeholder.value = $event.target.value;
                break;
            }
            case 'init': {
                const value = $event.target.value;
                if (dataVariable.init === undefined) {
                    // TODO: NAB-337: check
                    dataVariable.init = new I18nWithDynamic(value);
                } else {
                    dataVariable.init.value = value;
                }
                this.processData.find(obj => obj.id === item.id).init.value = $event.target.value;
                break;
            }
            case 'dynamic-init': {
                const value = $event.source.checked;
                if (dataVariable.init === undefined) {
                    // TODO: NAB-337: check
                    dataVariable.init = new I18nWithDynamic('', value);
                } else {
                    dataVariable.init.dynamic = value;
                }
                this.processData.find(obj => obj.id === item.id).init.dynamic = $event.source.checked;
                break;
            }
            case 'options-key': {
                dataVariable.options[index].key = $event.target.value;
                this.processData.find(obj => obj.id === item.id).options[index].key = $event.target.value;
                break;
            }
            case 'options-value': {
                dataVariable.options[index].value.value = $event.target.value;
                this.processData.find(obj => obj.id === item.id).options[index].value.value = $event.target.value;
                if (this.hasSimpleOptions(dataVariable.type)) {
                    this.setValue($event, item, 'options-key', index);
                }
                break;
            }
            case 'component-name': {
                dataVariable.component.name = $event.target.value;
                this.processData.find(obj => obj.id === item.id).component.name = $event.target.value;
                break;
            }
            case 'encryption': {
                dataVariable.encryption = $event.target.value;
                this.processData.find(obj => obj.id === item.id).encryption = $event.target.value;
                break;
            }
            case 'options-init': {
                dataVariable.optionsInit.expression = $event.target.value;
                this.processData.find(obj => obj.id === item.id).optionsInit.expression = $event.target.value;
                break;
            }
            case 'options-init-dynamic': {
                dataVariable.optionsInit.dynamic = $event.target.value;
                this.processData.find(obj => obj.id === item.id).optionsInit.dynamic = $event.target.value;
                break;
            }
            case 'allowedNets': {
                dataVariable.allowedNets[index] = $event.target.value;
                this.processData.find(obj => obj.id === item.id).allowedNets[index] = $event.target.value as string;
                break;
            }
            case 'property_key': {
                dataVariable.component.properties[index].key = $event.target.value as string;
                this.processData.find(obj => obj.id === item.id).component.properties[index].key = $event.target.value as string;
                break;
            }
            case 'property_value': {
                dataVariable.component.properties[index].value = $event.target.value as string;
                this.processData.find(obj => obj.id === item.id).component.properties[index].value = $event.target.value as string;
                break;
            }
        }
    }

    sortData(sort: Sort) {
        const firstCut = this.pageIndex * this.pageSize;
        const secondCut = firstCut + this.pageSize;
        if (!sort.active || sort.direction === '') {
            this.processData = this.modelService.model.getDataSet();
            this.dataSource = this.processData.slice(firstCut, secondCut);
            return;
        }

        this.processData.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'name':
                    return this.compare(a.title.value, b.title.value, isAsc);
                case 'id':
                    return this.compare(a.id, b.id, isAsc);
            }
        });
        this.dataSource = this.processData.slice(firstCut, secondCut);
    }

    compare(a: number | string, b: number | string, isAsc: boolean) {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    drop(event: CdkDragDrop<Array<string>>) {
        moveItemInArray(this.itemData.options, event.previousIndex, event.currentIndex);
    }

    dropOption(event: CdkDragDrop<Array<string>>) {
        moveItemInArray(this.itemData.options, event.previousIndex, event.currentIndex);
    }

    addOption() {
        this.itemData.options.push(Option.of(this.createKeyId(), new I18nString('value')));
    }

    addAllowedNet() {
        this.itemData.allowedNets.push('');
    }

    addProperty() {
        this.itemData.component.properties.push(new Property('', ''));
    }

    deleteOption(index: number) {
        this.itemData.options.splice(index, 1);
    }

    deleteAllowedNet(index: number) {
        this.itemData.allowedNets.splice(index, 1);
    }

    deleteProperty(index: number) {
        this.itemData.component.properties.splice(index, 1);
    }

    private createKeyId() {
        this.counterEnumMap++;
        if (this.itemData.options.find(item => item.key === 'key' + this.counterEnumMap)) {
            return this.createKeyId();
        } else {
            return 'key' + String(this.counterEnumMap);
        }
    }

    showIcons(event) {
        event.target.querySelectorAll('.data-edit-list-icon').forEach(node => {
            node.classList.remove('data-edit-list-icon-hidden');
        });
    }

    hideIcons(event) {
        event.target.querySelectorAll('.data-edit-list-icon').forEach(node => {
            node.classList.add('data-edit-list-icon-hidden');
        });
    }

    openDialog(event, item: DataVariable): void {
        event.stopPropagation();
        const dialogRef = this.dialog.open(DialogDeleteComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.removeDataVariable(item);
            }
        });
    }

    openRefactorDialog(event, item): void {
        const dialogRef = this.dialog.open(DialogRefactorComponent, {
            width: '50%',
            data: {originalId: item.id}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                this.processData.find(obj => obj.id === item.id).id = result;
                this.itemData.id = result;
            }
        });
    }

    createTransOptions() {
        return this.modelService.model.getTransitions().map(trans => ({
            key: trans.id,
            value: trans.label?.value ?? ''
        }));
    }

    private _filter(value: string): Array<EnumerationFieldValue> {
        const filterValue = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        return this.transitionOptions.filter(option => option.value.toLowerCase().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').indexOf(filterValue) === 0);
    }

    public renderSelection = (key) => {
        if (key !== undefined && key !== '' && key !== null) {
            if (this.transitionOptions.find(choice => choice.key === key)) {
                return key + ' - ' + this.transitionOptions.find(choice => choice.key === key).value;
            }
        }
        return key;
    }

    clickOption(item: DataVariable, init: string) {
        this.modelService.model.getData(item.id).init.value = init;
        this.processData.find(obj => obj.id === item.id).init.value = init;
    }

    isDisabled(id: string): boolean {
        const trans = this.modelService.model.getTransition(id);
        if (trans) {
            return trans.dataGroups.some(group => !!group.getDataRef(this.itemData.id));
        }
        return false;
    }

    createOrDelete() {
        if (this.itemData.component === undefined) {
            this.itemData.component = new PetriflowComponent('');
        } else {
            this.itemData.component = undefined;
        }
    }

    getItemTitle(item: DataVariable): string {
        return this.getItemI18n(item, 'title');
    }

    getItemPlaceholder(item: DataVariable): string {
        return this.getItemI18n(item, 'placeholder');
    }

    getItemDesc(item: DataVariable): string {
        return this.getItemI18n(item, 'desc');
    }

    private getItemI18n(item: DataVariable, property: string): string {
        return item[property]?.value ?? '';
    }

    getItemInitExpression(item: DataVariable): string {
        return item.init?.value ?? '';
    }

    getItemInitDynamic(item: DataVariable): boolean {
        return !!item.init?.dynamic;
    }

    getItemOptionsInitExpression(item: DataVariable): string {
        return item.optionsInit?.expression ?? '';
    }

    getItemOptionsInitDynamic(item: DataVariable): boolean {
        return !!item.optionsInit?.dynamic;
    }

    isOptionField(type: DataType): boolean {
        return [DataType.ENUMERATION, DataType.ENUMERATION_MAP, DataType.MULTICHOICE, DataType.MULTICHOICE_MAP].includes(type);
    }

    hasSimpleOptions(type: DataType): boolean {
        return [DataType.ENUMERATION, DataType.MULTICHOICE].includes(type);
    }

    hasInits(type: DataType): boolean {
        return DataFieldUtils.FIELDS_WITH_INITS.includes(type);
    }

    addInit() {

    }

    deleteInit(i: number) {
        this.itemData.inits.splice(i, 1);
    }

    // TODO: NAB-337: check
    changeInitsValue(inits: Array<string>) {
        this.itemData.inits = inits.map(initKey => new I18nWithDynamic(initKey));
    }

    getInitsValue(): Array<string> {
        return this.itemData.inits.map(initKey => initKey.value);
    }

    private removeSpecificAttributeOnChange() {
        this.itemData.inits = [];
        this.itemData.init.value = '';
        this.itemData.init.name = '';
        this.itemData.options = [];
    }
}
