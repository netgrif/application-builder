import {pointerCaptureTarget} from './pointer-capture-target';

describe('pointerCaptureTarget', () => {
    it('returns the original hit target', () => {
        const target = document.createElement('button');
        const container = document.createElement('div');
        target.setPointerCapture = jasmine.createSpy('targetCapture');
        container.setPointerCapture = jasmine.createSpy('containerCapture');
        const event = {
            target,
            currentTarget: container,
            pointerId: 7,
        } as unknown as PointerEvent;

        expect(pointerCaptureTarget(event)).toBe(target);
    });
});
