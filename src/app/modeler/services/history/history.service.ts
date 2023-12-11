import {Injectable} from '@angular/core';
import {ExportService, PetriNet} from '@netgrif/petriflow';
import {Subject} from 'rxjs';
import {HistoryChange} from './history-change';
import {ModelerConfig} from '../../modeler-config';
import {ModelService} from '../model/model.service';

@Injectable({
    providedIn: 'root'
})
export class HistoryService {

    private history: Array<PetriNet>;
    private readonly _historyChange: Subject<HistoryChange>;
    private head: number;

    constructor(
        private modelService: ModelService,
        private exportService: ExportService,
    ) {
        this.history = new Array<PetriNet>();
        this.head = 0;
        this._historyChange = new Subject();
        this.modelService.modelSubject.subscribe(model => {
            this.push(model?.clone());
        });
        this.modelService.placeChange.subscribe(value => {
            this.push(value?.model);
        });
        this.modelService.transitionChange.subscribe(value => {
            this.push(value?.model);
        });
        this.modelService.arcChange.subscribe(value => {
            this.push(value?.model);
        });
    }

    public undo(): PetriNet | undefined {
        if (this.head === 0) {
            return undefined;
        }
        this.head--;
        return this.reloadModel();
    }

    public redo(): PetriNet | undefined {
        if (this.head === this.history.length - 1) {
            return undefined;
        }
        this.head++;
        return this.reloadModel();
    }

    private reloadModel(): PetriNet {
        this.historyChange.next(new HistoryChange(this.head, this.history.length));
        const model = this.currentModel?.clone();
        this.modelService.model = model;
        return model;
    }

    private push(model: PetriNet): void {
        if (!model || model.lastChanged === this.currentModel?.lastChanged) {
            return;
        }
        if (this.history.length !== 0) {
            if (this.head === this.history.length - 1) {
                // TODO: NAB-326 pushed 153 models, fix
                if (this.history.length === ModelerConfig.HISTORY_SIZE) {
                    this.history.shift();
                }
            } else {
                // this.history.length = this.head + 1;
                this.history = this.history.slice(0, this.head + 1);
            }
        } else {
            this.head = -1;
        }
        this.history.push(model);
        this.head++;
        this.historyChange.next(new HistoryChange(this.head, this.history.length));
        this.saveToLocalStorage(model).then();
    }

    async saveToLocalStorage(model: PetriNet): Promise<void> {
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY, this.exportService.exportXml(model));
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP, new Date().toLocaleString());
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID, `${model.id}`);
        localStorage.setItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE, `${model.title.value}`);
    }

    get historyChange(): Subject<HistoryChange> {
        return this._historyChange;
    }

    get currentModel(): PetriNet {
        return this.history[this.head];
    }
}
