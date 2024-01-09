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
import {CanvasObject} from '../../domain/canvas-object';
import {CanvasPlace} from '../../domain/canvas-place';
import {ContextMenu} from '../../context-menu/context-menu';
import {EditPlaceMenuItem} from '../../context-menu/menu-items/edit-place-menu-item';
import {EditTransitionMenuItem} from '../../context-menu/menu-items/edit-transition-menu-item';
import {EditFormMenuItem} from '../../context-menu/menu-items/edit-form-menu-item';
import {EditTaskPermissionsMenuItem} from '../../context-menu/menu-items/edit-task-permissions-menu-item';
import {EditTaskActionsMenuItem} from '../../context-menu/menu-items/edit-task-actions-menu-item';
import {CanvasArc} from '../../domain/canvas-arc';
import {EditArcMenuItem} from '../../context-menu/menu-items/edit-arc-menu-item';
import {DeleteBreakpointMenuItem} from '../../context-menu/menu-items/delete-breakpoint-menu-item';
import {DeleteMenuItem} from '../../context-menu/menu-items/delete-menu-item';

export abstract class CanvasTool extends CanvasListenerTool {

    private readonly _editModeService: EditModeService;
    private readonly _hotkeys: Array<Hotkey>;

    protected constructor(
        id: string,
        button: ControlPanelButton,
        modelService: ModelService,
        dialog: MatDialog,
        editModeService: EditModeService,
        router: Router,
        transitionService: SelectedTransitionService
    ) {
        super(id, button, modelService, dialog, router, transitionService);
        this._editModeService = editModeService;
        this._hotkeys = new Array<Hotkey>();
        this.hotkeys.push(new Hotkey('Escape', false, false, false, this.reset.bind(this)));
    }

    bind() {
        super.bind();
        this.bindKeys();
    }

    unbind() {
        super.unbind();
        this.unbindKeys();
        this.closeContextMenu();
    }

    reset(): void {
    }

    bindKeys(): void {
        document.onkeydown = this.onKeyDown.bind(this);
        document.onkeyup = this.onKeyUp.bind(this);
    }

    unbindKeys(): void {
        document.onkeydown = undefined;
        document.onkeyup = undefined;
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.repeat) {
            return;
        }
        const hotkey = this._hotkeys.find(a => a.matches(event));
        if (!hotkey) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        hotkey.listener();
    }

    onKeyUp(event: KeyboardEvent): void {
    }

    onMouseLeave(event: MouseEvent): void {
        this.reset();
    }

    onTransitionClick(event: MouseEvent, transition: CanvasTransition) {
        super.onTransitionClick(event, transition);
        this.closeContextMenu();
    }

    onTransitionContextMenu(event: MouseEvent, transition: CanvasTransition): void {
        event.preventDefault();
        event.stopPropagation();
        this.editModeService.contextMenuItems.next(
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
        this.editModeService.contextMenuItems.next(
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
        this.editModeService.contextMenuItems.next(
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

    delete(object: CanvasObject<any, any>): void {

    }

    closeContextMenu(): void {
        this.editModeService.contextMenuItems?.next(undefined);
    }

    placeContextMenu(place: CanvasPlace, event: MouseEvent): ContextMenu {
        return new ContextMenu(
            [
                new EditPlaceMenuItem(place, this),
                new DeleteMenuItem(place, this)
            ],
            this.windowMousePosition(event)
        );
    }

    transitionContextMenu(transition: CanvasTransition, event: MouseEvent): ContextMenu {
        return new ContextMenu(
            [
                new EditTransitionMenuItem(transition, this),
                new EditFormMenuItem(transition, this),
                new EditTaskPermissionsMenuItem(transition, this),
                new EditTaskActionsMenuItem(transition, this),
                new DeleteMenuItem(transition, this)
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
        items.push(new DeleteMenuItem(arc, this));

        return new ContextMenu(
            items,
            windowPosition
        );
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

    get hotkeys(): Array<Hotkey> {
        return this._hotkeys;
    }
}
