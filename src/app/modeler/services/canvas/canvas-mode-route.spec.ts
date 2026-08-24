import {isCanvasModeRoute} from './canvas-mode-route';

describe('isCanvasModeRoute', () => {
    it('matches only the requested mode path', () => {
        expect(isCanvasModeRoute('/modeler', '/modeler')).toBeTrue();
        expect(isCanvasModeRoute('/modeler/simulation', '/modeler')).toBeFalse();
        expect(isCanvasModeRoute('/modeler/simulation', '/modeler/simulation')).toBeTrue();
    });

    it('ignores query parameters and fragments', () => {
        expect(isCanvasModeRoute('/modeler?process=car', '/modeler')).toBeTrue();
        expect(isCanvasModeRoute('/modeler/simulation#task', '/modeler/simulation')).toBeTrue();
    });
});
