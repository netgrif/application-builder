import {NavigationEnd, convertToParamMap} from '@angular/router';
import {Subject, of} from 'rxjs';
import {AppComponent} from './app.component';
import {ModelerConfig} from './modeler/modeler-config';

describe('AppComponent draft recovery navigation timing', () => {
    let app: AppComponent;
    let navigationEvents: Subject<NavigationEnd>;
    let queryParams: any;
    let dialogOpen: jasmine.Spy;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY, '<net/>');

        navigationEvents = new Subject<NavigationEnd>();
        queryParams = convertToParamMap({});
        dialogOpen = jasmine.createSpy('open').and.returnValue({afterClosed: () => of(undefined)});
        const router = {
            events: navigationEvents.asObservable(),
            routerState: {snapshot: {root: {get queryParamMap() { return queryParams; }}}},
        };

        app = new AppComponent(
            {get: () => ({})} as any,
            router as any,
            {open: dialogOpen} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {importFromXml: jasmine.createSpy('importFromXml')} as any,
        );
    });

    afterEach(() => localStorage.clear());

    it('waits for initial navigation before checking process query parameters', () => {
        app.ngAfterViewInit();

        expect(dialogOpen).not.toHaveBeenCalled();
        queryParams = convertToParamMap({process: 'demo-app/model.xml'});
        navigationEvents.next(new NavigationEnd(1, '/', '/modeler?process=demo-app/model.xml'));

        expect(dialogOpen).not.toHaveBeenCalled();
    });

    it('offers draft recovery after navigation when no model URL is present', () => {
        app.ngAfterViewInit();

        expect(dialogOpen).not.toHaveBeenCalled();
        navigationEvents.next(new NavigationEnd(1, '/', '/modeler'));

        expect(dialogOpen).toHaveBeenCalledTimes(1);
    });
});
