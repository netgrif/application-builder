import {CanvasElementCollection} from '../../domain/canvas-element-collection';
import {PetriflowCanvasService} from '@netgrif/petriflow.svg';
import {EditModeService} from '../../edit-mode.service';
import {MatDialog} from '@angular/material/dialog';
import {ModelService} from '../../../services/model/model.service';
import {CanvasListenerTool} from '../../../services/canvas/canvas-listener-tool';
import {ControlPanelButton} from '../../../control-panel/control-panel-button';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../../../selected-transition.service';
import {Hotkey} from './domain/hotkey';
import {ComponentType} from '@angular/cdk/overlay';
import {CanvasTransition} from '../../domain/canvas-transition';
import {CanvasPlace} from '../../domain/canvas-place';
import {ContextMenu} from '../../context-menu/context-menu';
import {EditPlaceMenuItem} from '../../context-menu/menu-items/place/edit-place-menu-item';
import {EditTransitionMenuItem} from '../../context-menu/menu-items/transition/edit-transition-menu-item';
import {EditFormMenuItem} from '../../context-menu/menu-items/transition/edit-form-menu-item';
import {
    EditTransitionPermissionsMenuItem
} from '../../context-menu/menu-items/transition/edit-transition-permissions-menu-item';
import {
    EditTransitionActionsMenuItem
} from '../../context-menu/menu-items/transition/edit-transition-actions-menu-item';
import {CanvasArc} from '../../domain/canvas-arc';
import {EditArcMenuItem} from '../../context-menu/menu-items/arc/edit-arc-menu-item';
import {DeleteBreakpointMenuItem} from '../../context-menu/menu-items/arc/delete-breakpoint-menu-item';
import {DeleteTransitionMenuItem} from '../../context-menu/menu-items/transition/delete-transition-menu-item';
import {DeleteArcMenuItem} from '../../context-menu/menu-items/arc/delete-arc-menu-item';
import {EditModelMenuItem} from '../../context-menu/menu-items/model/edit-model-menu-item';
import {ManageModelPermissionsMenuItem} from '../../context-menu/menu-items/model/manage-model-permissions-menu-item';
import {DeletePlaceMenuItem} from '../../context-menu/menu-items/place/delete-place-menu-item';

export abstract class CanvasTool extends CanvasListenerTool {

    private readonly _editModeService: EditModeService;

    protected constructor(
        id: string,        button: ControlPanelButton,
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(id, button, modelService, dialog, router, transitionService);
        this._editModeService = editModeService;
        this.hotkeys.push(new Hotkey('Escape', false, false, false, () => {
            this.closeContextMenu();
            this.reset();
        }));
    }

    isWorkInProgress(): boolean {
        return false;
    }

    bind() {
        super.bind();
    }

    unbind() {
        super.unbind();
        this.closeContextMenu();
    }

    reset(): void {
    }

    onMouseLeave(event: MouseEvent): void {
        this.reset();
    }

    onContextMenu(event: MouseEvent) {
        super.onContextMenu(event);
        this.openContextMenu(
            this.modelContextMenu(event)
        )
    }

    onTransitionClick(event: MouseEvent, transition: CanvasTransition) {
        super.onTransitionClick(event, transition);
        this.closeContextMenu();
    }

    onTransitionContextMenu(event: MouseEvent, transition: CanvasTransition): void {
        event.preventDefault();
        event.stopPropagation();
        this.openContextMenu(
            this.transitionContextMenu(transition, event)
        );
    }

    onPlaceClick(event: MouseEvent, place: CanvasPlace) {
        super.onPlaceClick(event, place);
        this.closeContextMenu();
    }

    onPlaceContextMenu(event: MouseEvent, place: CanvasPlace) {
        event.preventDefault();
        event.stopPropagation();
        this.openContextMenu(
            this.placeContextMenu(place, event)
        );
    }

    onArcClick(event: MouseEvent, arc: CanvasArc) {
        super.onArcClick(event, arc);
        this.closeContextMenu();
    }

    onArcContextMenu(event: MouseEvent, arc: CanvasArc) {
        event.preventDefault();
        event.stopPropagation();
        this.openContextMenu(
            this.arcContextMenu(arc, event)
        );
    }

    onMouseClick(event: MouseEvent) {
        super.onMouseClick(event);
        this.closeContextMenu();
    }

    onClick() {
        super.onClick();
        this.closeContextMenu();
    }

    openDialog(dialog: ComponentType<any>, config: any, afterClose?: (value: any) => void): void {
        this.unbindKeys();
        this.dialog.open(dialog, config).afterClosed().subscribe(value => {
            if (afterClose) {
                afterClose(value);
            }
            this.bindKeys();
        });
    }

    isContextMenuOpen(): boolean {
        return this.editModeService.contextMenuItems.value !== undefined;
    }

    deletePlace(place: CanvasPlace): void {
        this.editModeService.removePlace(place);
    }

    deleteTransition(transition: CanvasTransition): void {
        this.editModeService.removeTransition(transition);
    }

    deleteArc(arc: CanvasArc): void {
        this.editModeService.removeArc(arc);
    }

    closeContextMenu(): void {
        this.editModeService.contextMenuItems?.next(undefined);
    }

    placeContextMenu(place: CanvasPlace, event: MouseEvent): ContextMenu {
        return new ContextMenu(
            [
                new EditPlaceMenuItem(place, this),
                new DeletePlaceMenuItem(place, this)
            ],
            this.windowMousePosition(event)
        );
    }

    transitionContextMenu(transition: CanvasTransition, event: MouseEvent): ContextMenu {
        return new ContextMenu(
            [
                new EditTransitionMenuItem(transition, this),
                new EditFormMenuItem(transition, this),
                new EditTransitionPermissionsMenuItem(transition, this),
                new EditTransitionActionsMenuItem(transition, this),
                new DeleteTransitionMenuItem(transition, this)
            ],
            this.windowMousePosition(event)
        )
    }

    arcContextMenu(arc: CanvasArc, event: MouseEvent): ContextMenu {
        const canvasPosition = this.mousePosition(event);
        const windowPosition = this.windowMousePosition(event);
        const breakPointIndex = arc.findNearbyBreakpoint(canvasPosition);

        const items = [];
        items.push(new EditArcMenuItem(arc, this));
        if (breakPointIndex !== undefined) {
            items.push(new DeleteBreakpointMenuItem(arc, breakPointIndex, this));
        }
        items.push(new DeleteArcMenuItem(arc, this));

        return new ContextMenu(
            items,
            windowPosition
        );
    }

    modelContextMenu(event: MouseEvent): ContextMenu {
        return new ContextMenu([
            new EditModelMenuItem(this),
            new ManageModelPermissionsMenuItem(this)
        ], this.windowMousePosition(event));
    }

    openContextMenu(menu: ContextMenu): void {
        if (this.isWorkInProgress()) {
            return;
        }
        this.editModeService.contextMenuItems?.next(menu);
    }

    get canvasService(): PetriflowCanvasService {
        return this.editModeService.canvasService;
    }

    get elements(): CanvasElementCollection {
        return this.editModeService.elements;
    }

    get editModeService(): EditModeService {
        return this._editModeService;
    }
}
