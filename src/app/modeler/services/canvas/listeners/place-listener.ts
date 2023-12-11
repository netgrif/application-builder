import {CanvasPlace} from '../../../edit-mode/domain/canvas-place';

export interface PlaceListener {

    onPlaceDown(event: MouseEvent, place: CanvasPlace): void;

    onPlaceUp(event: MouseEvent, place: CanvasPlace): void;

    onPlaceClick(event: MouseEvent, place: CanvasPlace): void;

    onPlaceDoubleClick(event: MouseEvent, place: CanvasPlace): void;

    onPlaceEnter(event: MouseEvent, place: CanvasPlace): void;

    onPlaceLeave(event: MouseEvent, place: CanvasPlace): void;

    onPlaceMove(event: MouseEvent, place: CanvasPlace): void;

    onPlaceContextMenu(event: MouseEvent, arc: CanvasPlace): void;
}
