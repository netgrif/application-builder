import {CanvasTransition} from '../../../edit-mode/domain/canvas-transition';

export interface TransitionListener {

    onTransitionDown(event: MouseEvent, transition: CanvasTransition): void;

    onTransitionUp(event: MouseEvent, transition: CanvasTransition): void;

    onTransitionClick(event: MouseEvent, transition: CanvasTransition): void;

    onTransitionDoubleClick(event: MouseEvent, transition: CanvasTransition): void;

    onTransitionEnter(event: MouseEvent, transition: CanvasTransition): void;

    onTransitionLeave(event: MouseEvent, transition: CanvasTransition): void;

    onTransitionMove(event: MouseEvent, transition: CanvasTransition): void;

    onTransitionContextMenu(event: MouseEvent, arc: CanvasTransition): void;
}
