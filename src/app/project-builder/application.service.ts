import {Injectable, OnDestroy} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {PetriNet} from '@netgrif/petriflow';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {DialogDeleteModelComponent} from '../dialogs/dialog-delete-model/dialog-delete-model.component';
import {HistoryService} from '../modeler/services/history/history.service';
import {ModelService} from '../modeler/services/model/model.service';
import Application from './application';
import {SimulationModeService} from "../modeler/simulation-mode/simulation-mode.service";

@Injectable({
    providedIn: 'root',
})
export class ApplicationService implements OnDestroy {

    private readonly _models: Map<string, PetriNet>;
    private _application: Application;
    private _modelIdSequence = 0;

    private _modelSubscription: Subscription;

    constructor(
        private modelService: ModelService,
        private historyService: HistoryService,
        private dialog: MatDialog,
        private simulationModeService: SimulationModeService
    ) {
        this._models = new Map<string, PetriNet>();
        this._modelSubscription = modelService.modelSubject.pipe(
            filter(model => !!model),
        ).subscribe(model => {
            console.log('Model changed');
            /*this.models[model.id] = model;
            if (this._application) {
                this._application.addProcess(model);
            }*/
        });
    }

    ngOnDestroy(): void {
        this._modelSubscription.unsubscribe();
    }

    get numberOfProcesses(): number {
        return this._models.size;
    }

    get application(): Application {
        return this._application;
    }

    set application(value: Application) {
        this._application = value;
    }

    get models(): Map<string, PetriNet> {
        return this._models;
    }

    getAndIncrementModelSequence(): number {
        return this._modelIdSequence++;
    }

    getModel(id: string): PetriNet {
        return this._models.get(id);
    }

    getActiveModel(): PetriNet {
        return this.modelService.model;
    }

    createApplication(): Application {
        this._application = Application.getEmpty();
        this.addNewEmptyModel();
        console.log('New application created', this._application);
        return this._application;
    }

    private deleteModel(processId: string): PetriNet | undefined {
        const deletedModel = this._models.get(processId);
        if (!deletedModel) {
            return undefined;
        }

        const activeModelId = this.modelService.model?.id;
        this._models.delete(processId);

        if (activeModelId === processId || !this._models.has(activeModelId)) {
            if (this._models.size === 0) {
                this.clearActiveModel();
            } else {
                this.switchActiveModel(this._models.keys().next().value);
            }
        }

        this.updateProcesses();
        console.log('Process removed', processId);
        return deletedModel;
    }

    removeModel(processId: string, confirmationDialog = true): void {
        if (!confirmationDialog) {
            this.removeConfirmedModel(processId);
        } else {
            const dialogRef = this.dialog.open(DialogDeleteModelComponent);
            dialogRef.afterClosed().subscribe(result => {
                if (result === true) {
                    this.removeConfirmedModel(processId);
                }
            });
        }
    }

    private removeConfirmedModel(processId: string): void {
        const deletedModel = this.deleteModel(processId);
        if (deletedModel) {
            this.historyService.save(`Model ${processId} has been deleted.`, deletedModel);
        }
    }

    addModel(net: PetriNet): boolean {
        if (this._models.has(net.id)) {
            return false;
        }

        const shouldActivate = !this._models.has(this.modelService.model?.id);
        this._models.set(net.id, net);
        this.updateProcesses();
        this.historyService.save(`New model has been created.`, net);
        if (shouldActivate) {
            this.switchActiveModel(net.id);
        }
        console.log('New process added', net.id);
        return true;
    }

    addNewEmptyModel(): PetriNet {
        let newModel: PetriNet;
        do {
            newModel = this.modelService.newModel();
        } while (this._models.has(newModel.id));
        this.addModel(newModel);
        return newModel;
    }

    replaceActiveModel(net: PetriNet): boolean {
        const activeModelId = this.modelService.model?.id;
        const replacedModelId = this._models.has(activeModelId)
            ? activeModelId
            : this._models.size === 1
                ? this._models.keys().next().value
                : undefined;

        if (replacedModelId !== undefined && replacedModelId !== net.id && this._models.has(net.id)) {
            return false;
        }

        if (replacedModelId === undefined) {
            this._models.set(net.id, net);
        } else {
            const models = [...this._models.entries()];
            this._models.clear();
            models.forEach(([id, model]) => {
                if (id === replacedModelId) {
                    this._models.set(net.id, net);
                } else {
                    this._models.set(id, model);
                }
            });
        }

        this.updateProcesses();
        this.modelService.model = net;
        this.simulationModeService.originalModel.next(net);
        console.log('Current process replaced', replacedModelId, '->', net.id);
        return true;
    }

    updateModelId(oldId: string, newId: string) {
        if (!this._models.get(oldId)) return;
        this._models.set(newId, this._models.get(oldId));
        this._models.delete(oldId);
        this.updateProcesses();
        console.log('Process id updated', oldId, '->', newId);
    }

    switchActiveModel(processId: string) {
        if (!this._models.get(processId)) return;
        this.modelService.model = this._models.get(processId);
        this.simulationModeService.originalModel.next(this._models.get(processId));
        this.historyService.save(`Model ${this.modelService.model.id} has been changed.`, this._models.get(processId));
        console.log('Current process switched', processId);
    }

    switchToFirst() {
        if (this._application?.processes.length > 0) {
            this.switchActiveModel(this._application.processes[0]);
        } else {
            this.clearActiveModel();
        }
    }

    private clearActiveModel(): void {
        this.modelService.model = undefined;
        this.simulationModeService.originalModel.next(undefined);
    }

    updateProcesses(): void {
        if (this._application) {
            this._application.processes = [...this._models.keys()];
        }
    }
}
