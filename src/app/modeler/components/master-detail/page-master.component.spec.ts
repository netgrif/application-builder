import {TestBed} from '@angular/core/testing';
import {Sort} from '@angular/material/sort';
import {BehaviorSubject} from 'rxjs';
import {AbstractMasterDetailService} from './abstract-master-detail.service';
import {PageMasterComponent} from './page-master.component';
import {ModelService} from '../../services/model/model.service';

class TestMasterDetailService extends AbstractMasterDetailService<{id: string}> {
    items: Array<{id: string}> = [];

    constructor() {
        super();
    }

    get allData(): Array<{id: string}> {
        return this.items;
    }

    create(): {id: string} {
        return undefined;
    }

    delete(): void {
    }

    duplicate(): {id: string} {
        return undefined;
    }

    getAllDataSorted(): Array<{id: string}> {
        return [...this.items];
    }

    getSortFromLocalStorage(): Sort {
        return {active: 'id', direction: 'asc'};
    }

    setSortToLocalStorage(): void {
    }
}

class TestPageMasterComponent extends PageMasterComponent {
    constructor() {
        super();
    }
}

describe('PageMasterComponent', () => {
    let component: TestPageMasterComponent;
    let masterService: TestMasterDetailService;
    let modelService: {model: object; modelSubject: BehaviorSubject<object>};

    beforeEach(() => {
        modelService = {
            model: {},
            modelSubject: new BehaviorSubject<object>({})
        };
        TestBed.configureTestingModule({
            providers: [
                {provide: ModelService, useValue: modelService}
            ]
        });
        masterService = new TestMasterDetailService();
        component = TestBed.runInInjectionContext(() => new TestPageMasterComponent());
        component.masterService = masterService;
    });

    it('refreshes data and selection when the active model changes', () => {
        const firstModelItem = {id: 'first'};
        const secondModelItem = {id: 'second'};
        masterService.items = [firstModelItem];
        component.ngOnInit();

        expect(component.pageData).toEqual([firstModelItem]);
        expect(masterService.getSelected()).toBe(firstModelItem);

        masterService.items = [secondModelItem];
        modelService.model = {};
        modelService.modelSubject.next(modelService.model);

        expect(component.pageData).toEqual([secondModelItem]);
        expect(masterService.getSelected()).toBe(secondModelItem);
    });

    it('clears a stale selection when the new model has no items', () => {
        masterService.items = [{id: 'first'}];
        component.ngOnInit();

        masterService.items = [];
        modelService.model = {};
        modelService.modelSubject.next(modelService.model);

        expect(component.pageData).toEqual([]);
        expect(masterService.getSelected()).toBeUndefined();
    });
});
