import {CanvasPlace} from '../../domain/canvas-place';
import {CanvasTransition} from '../../domain/canvas-transition';
import {CreateArcTool} from './create-arc-tool';
import {ArcType} from '@netgrif/petriflow';

export abstract class CreatePTArc extends CreateArcTool<CanvasPlace> {

    public abstract arcType(): ArcType;

    public abstract getMarkerId(): string;

    onPlaceClick(event: MouseEvent, place: CanvasPlace): void {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            return;
        }
        if (!!this.source) {
            return;
        }
        event.stopPropagation();
        this.source = place;
        this.arcLine = this.editModeService.createTemporaryArc(place.svgPlace.getPosition(), this.getMarkerId());
    }

    onTransitionClick(event: MouseEvent, transition: CanvasTransition): void {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            return;
        }
        if (!this.source) {
            return;
        }
        event.stopPropagation();
        const canvasArc = this.createArc(this.arcType(), this.source, transition);
        this.bindArc(canvasArc);
        this.reset();
    }

    onMouseClick(event: MouseEvent) {
        if (this.isContextMenuOpen()) {
            this.closeContextMenu();
            return;
        }
        super.onMouseClick(event);
        this.reset();
    }
}
