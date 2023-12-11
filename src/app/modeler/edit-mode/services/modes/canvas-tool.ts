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

    openDialog(dialog: ComponentType<any>, config: any, afterClose?: (value: any) => void): void {
        this.unbindKeys();
        this.dialog.open(dialog, config).afterClosed().subscribe(value => {
            if (afterClose) {
                afterClose(value);
            }
            this.bindKeys();
        });
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
