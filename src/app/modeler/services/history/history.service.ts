import {Injectable} from '@angular/core';
import {ExportService, PetriNet} from '@netgrif/petriflow';
import {Subject} from 'rxjs';
import {ModelerConfig} from '../../modeler-config';
import {ModelService} from '../model/model.service';
import {History} from './history';
import {HistoryChange} from './history-change';
import {UndoTool} from '../../control-panel/modes/undo-tool';
import {RedoTool} from '../../control-panel/modes/redo-tool';
import {PetriflowXmlCompatibilityService} from '../../petriflow-xml-compatibility.service';

@Injectable({
    providedIn: 'root'
})
export class HistoryService {

    private readonly _history: History<PetriNet>;
    private readonly _historyChange: Subject<HistoryChange<PetriNet>>;

    constructor(
        private modelService: ModelService,
        private exportService: ExportService,
        private xmlCompatibility: PetriflowXmlCompatibilityService,
    ) {
        this._history = new History<PetriNet>();
        this._historyChange = new Subject();
    }

    public save(message: string, model?: PetriNet): void {
        model = model ?? this.modelService.model;
        if (!model) {
            return;
        }
        model.lastChanged = this.nextTimestamp();
        this.reloadUsageEstimate(model);
        this.push(model.clone(), message);
    }

    public undo(): void {
        this.reloadModel(this._history.undo(), UndoTool.ID);
    }

    public redo(): void {
        this.reloadModel(this._history.redo(), RedoTool.ID);
    }

    public reload(model: PetriNet): void {
        this._history.head = this._history.memory.findIndex(value => value.record === model);
        this.reloadModel(model, '');
    }

    private reloadModel(model: PetriNet, message: string): PetriNet {
        if (model === undefined) {
            return undefined;
        }
        this.historyChange.next(HistoryChange.of(this._history, message));
        this.reloadUsageEstimate(model);
        this.modelService.model = model.clone();
        return model;
    }

    private push(model: PetriNet, message: string): void {
        if (!model) {
            return;
        }
        const update = this._history.push(model, message);
        this.historyChange.next(update);
        this.saveToLocalStorage(model).then();
    }

    private reloadUsageEstimate(model: PetriNet): void {
        model.tags.set(ModelService.USAGE_ESTIMATE_TAG, ModelService.calculateEventUsage(model).toString(10));
    }

    private nextTimestamp(): number {
        const latestTimestamp = this._history.memory.reduce(
            (latest, change) => Math.max(latest, change.record?.lastChanged ?? 0),
            0,
        );
        return Math.max(Date.now(), latestTimestamp + 1);
    }

    private serialize(model: PetriNet): string {
        return this.xmlCompatibility.normalizeExport(this.exportService.exportXml(model));
    }

    async saveToLocalStorage(model: PetriNet): Promise<void> {
        const xml = this.serialize(model);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY, xml);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP, new Date().toLocaleString());
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID, `${model.id}`);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE, `${model.title.value}`);
    }

    changesForModel(modelId: string): Array<HistoryChange<PetriNet>> {
        return this._history.memory.filter(change => change.record?.id === modelId);
    }

    get historyChange(): Subject<HistoryChange<PetriNet>> {
        return this._historyChange;
    }

    get currentModel(): PetriNet {
        return this._history.record;
    }

    get history(): History<PetriNet> {
        return this._history;
    }
}
