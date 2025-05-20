import {Injectable, OnDestroy} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {PetriNet} from '@netgrif/petriflow';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {DialogDeleteModelComponent} from '../dialogs/dialog-delete-model/dialog-delete-model.component';
import {HistoryService} from '../modeler/services/history/history.service';
import {ModelService} from '../modeler/services/model/model.service';
import Application from './application';

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

    private deleteModel(processId: string) {
        if (this.modelService.model.id === processId) {
            if (this._models.size > 1) {
                this.switchActiveModel(this._models.keys().next().value);
            } else {
                this.addNewEmptyModel(); // nemôže byť aplikácie bez procesu
                this.switchActiveModel(this._models.keys().next().value);
            }
        }
        this._models.delete(processId);
        this.updateProcesses();
        console.log('Process removed', processId);
    }

    removeModel(processId: string, confirmationDialog = true) { // TODO remove cez app edit dialog nefunguje, vymaze iný prvok
        if (!confirmationDialog) {
            this.deleteModel(processId);
        } else {
            const dialogRef = this.dialog.open(DialogDeleteModelComponent);
            dialogRef.afterClosed().subscribe(result => {
                if (result === true) {
                    const oldId = this.modelService.model.id;
                    this.deleteModel(oldId);
                    this.historyService.save(`Model ${oldId} has been deleted.`, this.modelService.model);
                }
            });
        }
    }

    addModel(net: PetriNet): void {
        this._models.set(net.id, net);
        this.updateProcesses();
        this.historyService.save(`New model has been created.`, net);
        console.log('New process added', net.id);
    }

    addNewEmptyModel() {
        const newModel = this.modelService.newModel();
        this._models.set(newModel.id, newModel);
        this.updateProcesses();
        // this.modelService.model = this.modelService.newModel();
        this.historyService.save(`New model has been created.`, newModel);
        console.log('New process added', newModel.id);
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
        this.historyService.save(`Model ${this.modelService.model.id} has been changed.`, this._models.get(processId));
        console.log('Current process switched', processId);
    }

    switchToFirst() {
        if (this._application.processes.length > 0) {
            this.modelService.model = this._models.get(this._application.processes[0]);
        }
    }

    updateProcesses(): void {
        this._application.processes = [...this._models.keys()];
    }
}
