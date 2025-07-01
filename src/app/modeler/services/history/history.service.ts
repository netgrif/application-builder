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

    private readonly _histories: Map<string, History<PetriNet>>;

    constructor(
        private modelService: ModelService,
        private exportService: ExportService,
    ) {
        this._histories = new Map<string, History<PetriNet>>();
    }

    public save(message: string, model?: PetriNet): void {
        model = model ?? this.modelService.model;
        model.lastChanged = Date.now();
        this.push(model.clone(), message);
    }

    public undo(id = this.getId()): void {
        const history = this.findById(id);
        this.reloadModel(history.undo(), UndoTool.ID);
    }

    public redo(id = this.getId()): void {
        const history = this.findById(id);
        this.reloadModel(history.redo(), RedoTool.ID);
    }

    public reload(model: PetriNet): void {
        this.history(model.id).head = this.history(model.id).memory.findIndex(value => value.record === model);
        this.reloadModel(model, '');
    }

    public changeId(oldId: string, newId: string): void {
        this._histories.set(newId, this._histories.get(oldId));
        this._histories.delete(oldId);
    }

    private getId(): string {
        return this.modelService.model.id;
    }

    private reloadModel(model: PetriNet, message: string): PetriNet {
        if (model === undefined) {
            return undefined;
        }
        this.historyChange(model.id).next(HistoryChange.of(this.history(model.id), message));
        const newModel = model.clone();
        this.modelService.appService.updateModel(this.modelService.model.id, newModel);
        this.modelService.model = newModel;
        return model;
    }

    private push(model: PetriNet, message: string): void {
        if (!model || model.lastChanged === this.currentModel(model.id)?.lastChanged || this.history(model.id).memory.find(change =>
            change.record.lastChanged === model.lastChanged)
        ) {
            return;
        }
        const update = this.findById(model.id).push(model, message);
        this.historyChange(model.id).next(update);
        this.saveToLocalStorage(model).then();
    }

    private findById(id: string): History<PetriNet> {
        if (!this._histories.has(id)) {
            this._histories.set(id, new History<PetriNet>())
        }
        return this._histories.get(id);
    }

    async saveToLocalStorage(model: PetriNet): Promise<void> {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY, this.exportService.exportXml(model));
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP, new Date().toLocaleString());
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID, `${model.id}`);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE, `${model.title.value}`);
    }

    public historyChange(id = this.getId()): Subject<HistoryChange<PetriNet>> {
        return this.findById(id).change;
    }

    public currentModel(id = this.getId()): PetriNet {
        return this.findById(id).record;
    }

    public history(id = this.getId()): History<PetriNet> {
        return this.findById(id);
    }
}
