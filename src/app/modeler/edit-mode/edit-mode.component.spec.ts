import {ElementRef} from '@angular/core';
import {fakeAsync, tick} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {EditModeComponent} from './edit-mode.component';

describe('EditModeComponent', () => {
    it('rebinds the active canvas tool after the SVG view is initialized', fakeAsync(() => {
        const editModeService = {
            contextMenuItems: new BehaviorSubject(undefined),
            renderModel: jasmine.createSpy('renderModel'),
        };
        const component = new EditModeComponent(
            {} as any,
            editModeService as any,
            {} as any,
        );
        component.contextMenu = new ElementRef({style: {}});

        component.ngAfterViewInit();
        tick();

        expect(editModeService.renderModel).toHaveBeenCalledTimes(1);
    }));
});
