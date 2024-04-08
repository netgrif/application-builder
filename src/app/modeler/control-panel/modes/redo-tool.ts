import {Tool} from '../tools/tool';
import {HistoryService} from '../../services/history/history.service';
import {ControlPanelButton} from '../control-panel-button';
import {ControlPanelIcon} from '../control-panel-icon';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class RedoTool extends Tool {

    public static readonly ID = 'redo';

    constructor(
        private history: HistoryService
    ) {
        super(
            RedoTool.ID,
            new ControlPanelButton(
                new ControlPanelIcon('redo', false, true),
                'Redo'
            )
        );
        this.disabled.next(true);
        history.historyChange.subscribe(change => {
            this.disabled.next(change.size === 0 || change.head === change.size - 1);
        });
    }

    onClick(): void {
        this.history.redo();
    }
}
