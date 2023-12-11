import {EventEmitter, Injectable, Injector} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {DataType, DataVariable} from '@netgrif/petriflow';
import {ModeService} from '../control-panel/modes/mode-component/mode.service';
import {TutorialService} from '../../tutorial/tutorial-service';
import {Mode} from '../control-panel/modes/mode';
import {ControlPanelButton} from '../control-panel/control-panel-button';
import {ControlPanelIcon} from '../control-panel/control-panel-icon';
import {Tool} from '../control-panel/tools/tool';

@Injectable({
    providedIn: 'root'
})
export class DataModeService extends ModeService<Tool> {
    event: EventEmitter<void>;
    itemData: BehaviorSubject<DataVariable>;

    constructor(
        private _tutorialService: TutorialService,
        private _parentInjector: Injector
    ) {
        super();
        this.event = new EventEmitter();
        this.itemData = new BehaviorSubject<DataVariable>(new DataVariable('first', DataType.TEXT)); // TODO ReplaySubject / undefined init hodnota
        this.mode = new Mode(
            'data',
            new ControlPanelButton(
                new ControlPanelIcon('playlist_add'),
                'Data Edit view'
            ),
            './data',
            '/modeler/data',
            this._tutorialService.dataEditor,
            this._parentInjector
        );
        this.tools = [];
    }
}
