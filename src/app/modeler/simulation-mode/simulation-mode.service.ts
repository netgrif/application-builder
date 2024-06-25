import {Injectable, Injector} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {BasicSimulation, PetriNet, Transition} from '@netgrif/petriflow';
import {TutorialService} from '../../tutorial/tutorial-service';
import {ModelService} from '../services/model/model.service';
import {EventSimulationTool} from './tool/event-simulation.tool';
import {TaskSimulationTool} from './tool/task-simulation.tool';
import {ResetSimulationTool} from './tool/reset-simulation.tool';
import {ToolGroup} from '../control-panel/tools/tool-group';
import {PetriflowCanvasService} from '@netgrif/petriflow.svg';
import {SimulationTool} from './tool/simulation-tool';
import {ChangeDataTool} from './tool/change-data-tool';
import {CanvasTransition} from '../edit-mode/domain/canvas-transition';
import {ArcFactory} from '../edit-mode/domain/arc-builders/arc-factory.service';
import {CanvasModeService} from '../services/canvas/canvas-mode-service';
import {CanvasArc} from '../edit-mode/domain/canvas-arc';
import {MatDialog} from '@angular/material/dialog';
import {ResetPositionAndZoomTool} from './tool/reset-position-and-zoom-tool';
import {GridTool} from './tool/grid-tool';
import {SwitchLabelTool} from './tool/switch-label-tool';
import {Router} from '@angular/router';
import {SelectedTransitionService} from '../selected-transition.service';
import {SimulationMode} from './simulation-mode';

@Injectable({
    providedIn: 'root'
})
export class SimulationModeService extends CanvasModeService<SimulationTool> {

    private _simulation: BasicSimulation;
    private _data: Map<string, number>;
    public originalModel: BehaviorSubject<PetriNet>;
// TODO: NAB-326 refactor
    public switchTools: ToolGroup<SimulationTool>;
    private _onTransitionDraw: (t: CanvasTransition) => void;

    constructor(
        _arcFactory: ArcFactory,
        modelService: ModelService,
        _canvasService: PetriflowCanvasService,
        dialog: MatDialog,
        router: Router,
        transitionService: SelectedTransitionService,
        private tutorialService: TutorialService,
        private parentInjector: Injector,
    ) {
        super(_arcFactory, modelService, _canvasService);
        this._data = new Map<string, number>();
        this.mode = new SimulationMode(
            this.tutorialService.simulator,
            this.parentInjector,
        );
        this.onTransitionDraw = (_: CanvasTransition) => {
        };
        this.multiplicityText = (a: CanvasArc) => {
            if (!!a.modelArc.reference) {
                let multiplicity = 0;
                if (this.data.has(a.modelArc.reference)) {
                    multiplicity = this.data.get(a.modelArc.reference);
                } else {
                    multiplicity = this.modelService.getReferenceValue(a.modelArc.reference);
                }
                return `${a.modelArc.reference} (${multiplicity})`;
            }
            if (a.modelArc.multiplicity > 1) {
                return `${a.modelArc.multiplicity}`;
            }
            return '';
        };
        this.defaultTool = new TaskSimulationTool(modelService, dialog, this, router, transitionService);
        this.switchTools = new ToolGroup<SimulationTool>(
            new ResetSimulationTool(modelService, dialog, this, router, transitionService),
            new ChangeDataTool(modelService, dialog, this, router, transitionService),
            new ResetPositionAndZoomTool(modelService, dialog, this, router, transitionService),
            new GridTool(modelService, dialog, this, router, transitionService),
            new SwitchLabelTool(modelService, dialog, this, router, transitionService)
        );
        this.switchTools.tools.forEach(t => t.bind());
        this.tools = [
            new ToolGroup<SimulationTool>(
                this.defaultTool,
                new EventSimulationTool(modelService, dialog, this, router, transitionService),
            ),
            this.switchTools
        ];
        this.originalModel = new BehaviorSubject<PetriNet>(this.modelService.model.clone());
        this.originalModel.subscribe(model => {
            this.data = new Map(model.getArcs().filter(a => !!a.reference && !!model.getData(a.reference))
                .map(a => [a.reference, Number.parseInt(model.getData(a.reference).init?.value, 10) || 0]));
            this.simulation = new BasicSimulation(model, this.data);
            this.renderModel(model);
        });
    }

    renderModel(model: PetriNet = this.originalModel.value) {
        super.renderModel(model);
    }

    activate(tool?: SimulationTool) {
        if (tool === undefined) {
            tool = this.defaultTool;
        }
        if (this.switchTools.tools.includes(tool)) {
            return;
        }
        this.activeTool?.unbind();
        super.activate(tool);
        this.activeTool.bind();
    }

    public newSvgTransition(modelTransition: Transition): CanvasTransition {
        const canvasTransition = super.newSvgTransition(modelTransition);
        this.activeTool.bindTransition(canvasTransition);
        this._onTransitionDraw(canvasTransition);
        return canvasTransition;
    }

    set onTransitionDraw(value: (t: CanvasTransition) => void) {
        this._onTransitionDraw = value;
    }

    get simulation(): BasicSimulation {
        return this._simulation;
    }

    set simulation(value: BasicSimulation) {
        this._simulation = value;
    }

    get data(): Map<string, number> {
        return this._data;
    }

    set data(value: Map<string, number>) {
        this._data = value;
    }

    get model(): PetriNet {
        return this.simulation.simulationModel;
    }
}
