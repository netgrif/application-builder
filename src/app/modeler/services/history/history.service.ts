import {Injectable} from '@angular/core';
import {ExportService, PetriNet} from '@netgrif/petriflow';
import {Subject} from 'rxjs';
import {ModelerConfig} from '../../modeler-config';
import {ModelService} from '../model/model.service';
import {History} from './history';
import {HistoryChange} from './history-change';
import {UndoTool} from '../../control-panel/modes/undo-tool';
import {RedoTool} from '../../control-panel/modes/redo-tool';

@Injectable({
    providedIn: 'root'
})
export class HistoryService {

    private readonly history: History<PetriNet>;
    private readonly _historyChange: Subject<HistoryChange<PetriNet>>;

    constructor(
        private modelService: ModelService,
        private exportService: ExportService,
    ) {
        this.history = new History<PetriNet>();
        this._historyChange = new Subject();
        this.modelService.modelSubject.subscribe(model => {
            this.push(model?.clone(), `Model ${model.id} changed`);
        });
        this.modelService.placeChange.subscribe(value => {
            this.push(value?.model, `Place ${value?.id} changed`);
        });
        this.modelService.transitionChange.subscribe(value => {
            this.push(value?.model, `Transition ${value?.id} changed`);
        });
        this.modelService.arcChange.subscribe(value => {
            this.push(value?.model, `Arc ${value?.id} changed`);
        });
    }

    public undo(): void {
        this.reloadModel(this.history.undo(), UndoTool.ID);
    }

    public redo(): void {
        this.reloadModel(this.history.redo(), RedoTool.ID);
    }

    private reloadModel(model: PetriNet, message: string): PetriNet {
        if (model === undefined) {
            return undefined;
        }
        this.historyChange.next(HistoryChange.of(this.history, message));
        this.modelService.model = model.clone();
        return model;
    }

    private push(model: PetriNet, message: string): void {
        if (!model || model.lastChanged === this.currentModel?.lastChanged) {
            return;
        }
        const update = this.history.push(model, message);
        this.historyChange.next(update);
        this.saveToLocalStorage(model).then();
    }

    async saveToLocalStorage(model: PetriNet): Promise<void> {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY, this.exportService.exportXml(model));
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP, new Date().toLocaleString());
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID, `${model.id}`);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE, `${model.title.value}`);
    }

    get historyChange(): Subject<HistoryChange<PetriNet>> {
        return this._historyChange;
    }

    get currentModel(): PetriNet {
        return this.history.record;
    }
}
