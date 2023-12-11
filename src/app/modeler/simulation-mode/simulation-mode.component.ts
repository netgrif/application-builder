import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';
import {Canvas} from '../classes/canvas';
import {PetriNet} from '../classes/petri-net';
import {ModelerConfig} from '../modeler-config';
import {CanvasService} from '../services/canvas.service';
import {ModelService} from '../services/model.service';
import {SimulationModeService} from './simulation-mode.service';

@Component({
  selector: 'nab-simulation-mode',
  templateUrl: './simulation-mode.component.html',
  styleUrls: ['./simulation-mode.component.scss'],
})
export class SimulationModeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvas: ElementRef;

  constructor(private modelService: ModelService, private canvasService: CanvasService, private simulService: SimulationModeService) {
  }

  ngAfterViewInit() {
    this.canvasService.canvas = new Canvas(this.canvas.nativeElement);
    this.canvasService.canvas.resize(this.modelService.appwidth, this.modelService.appheight);

    // LEGACY PART
    ModelerConfig.VERTICAL_OFFSET = this.canvas.nativeElement.offsetTop;
    ModelerConfig.HORIZONTAL_OFFSET = this.canvas.nativeElement.offsetLeft;

    setTimeout(() => {
      if (this.modelService.model === undefined) {
        this.modelService.model = new PetriflowPetriNet();
        this.modelService.graphicModel = new PetriNet(this.modelService.model);
      }
      this.simulService.modelClone();
      this.canvasService.renderModel(this.modelService.model);
      this.reset('fire');
    });
  }

  ngOnDestroy(): void {
    this.simulService.modelOnDestroy();
  }

  doMouseDown($event: MouseEvent) {
    this.canvasService.doMouseDown($event);
  }

  doMouseMove($event: MouseEvent) {
    this.canvasService.doMouseMove($event);
  }

  reset(field: string) {
    this.modelService.whichButton.next(field);
    this.canvasService.reset();
  }
}
