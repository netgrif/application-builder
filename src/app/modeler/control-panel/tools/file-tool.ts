import {Tool} from './tool';
import {ControlPanelButton} from '../control-panel-button';
import {Type} from '@angular/core';

export abstract class FileTool extends Tool {

    protected constructor(id: string, button: ControlPanelButton, component: Type<any>) {
        super(id, button, component);
    }

    public abstract handleFileContent(content: string): void;

    public onEvent($event: Event): void {
        const file = ($event.target as HTMLInputElement).files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.handleFileContent(reader.result as string);
        };
        reader.readAsText(file);
    }

    onClick() {
    }
}
