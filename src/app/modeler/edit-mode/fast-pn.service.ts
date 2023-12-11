import {Injectable} from '@angular/core';
import {
  Arc as PetriflowArc,
  ArcType,
  Place as PetriflowPlace,
  Transition as PetriflowTransition,
} from '@netgrif/petriflow';
import {BehaviorSubject} from 'rxjs';
import {Arc} from '../classes/arc/arc';
import {Place} from '../classes/place/place';
import {Transition} from '../classes/transition/transition';
import {ControlPanelComponent} from '../control-panel/control-panel.component';
import {ModelerConfig} from '../modeler-config';
import {CanvasService} from '../services/canvas.service';
import {ModelService} from '../services/model.service';
import {FastModeContextComponent} from './fast-mode-context/fast-mode-context.component';
import {FastPnMode} from './fast-pn-mode.enum';

@Injectable({
  providedIn: 'root',
})
export class FastPnService {

  controlPanelComponent: BehaviorSubject<ControlPanelComponent>;
  canvasService: CanvasService;
  fastModeContext: BehaviorSubject<FastModeContextComponent>;
  lastElement: Place | Transition;
  preEndLastElement: any;
  actualMode: FastPnMode;

  constructor(private modelService: ModelService) {
    this.controlPanelComponent = new BehaviorSubject<ControlPanelComponent>(undefined);
    this.fastModeContext = new BehaviorSubject(undefined);
  }

  endFastPn() {
    this.fastModeContext.getValue().stopFastPn();
  }

  switchToFastPn() {
    this.controlPanelComponent.value.resetFast('place');
  }

  connectToExistingElement(typeOfArc: ArcType) {
    this.actualMode = FastPnMode.ARC;
    this.canvasService.isActiveFastPn.next(true);
    this.removeOldArc();

    const transition = this.lastElement as Transition;
    this.createArcToElement((this.modelService.source_hrany as Place).place, transition.transition, transition, typeOfArc);
    this.modelService.hybesaprechod = 1;
    this.modelService.hybesamiesto = 0;
    this.modelService.movedprechod = transition;
    this.modelService.movedmiesto = undefined;
    this.controlPanelComponent.getValue().resetFast('move');
    this.canvasService.startAgain.next(false);
  }

  transitionToPlace(transition: Transition) {
    this.preEndLastElement = transition;
    this.canvasService = this.controlPanelComponent.getValue().canvasService;
    this.controlPanelComponent.value.resetFast('arc');
    if (this.modelService.whichButton.getValue() === 'arc') {
      this.createSvgArcFromElement(transition.transition.x, transition.transition.y, transition);
      const place = this.connectDestionationPlace(transition);
      this.createArcToElement((this.modelService.source_hrany as Transition).transition, place.place, place, ArcType.REGULAR);
      this.modelService.hybesaprechod = 0;
      this.modelService.hybesamiesto = 1;
      this.modelService.movedprechod = undefined;
      this.modelService.movedmiesto = place;
      this.controlPanelComponent.getValue().resetFast('move');
    }
  }

  connectDestionationPlace(transition: Transition): Place {
    this.modelService.updatePreviousState();
    const place = new PetriflowPlace(transition.transition.x, transition.transition.y, false, `p${this.modelService.nextPlaceId()}`);
    this.modelService.model.addPlace(place);
    const graphicPlace = new Place(place);
    this.modelService.graphicModel.places.unshift(graphicPlace);
    this.canvasService.renderPlace(graphicPlace);
    this.canvasService.elementypredhrany(this.modelService.graphicModel);
    this.canvasService.labelypredhranyprve(this.modelService.graphicModel);
    return graphicPlace;
  }

  placeToTransition(place: Place) {
    this.preEndLastElement = place;
    this.canvasService = this.controlPanelComponent.getValue().canvasService;
    this.controlPanelComponent.value.resetFast('arc');
    if (this.modelService.whichButton.getValue() === 'arc') {
      this.createSvgArcFromElement(place.place.x, place.place.y, place);
      const transition = this.connectDestinationTransition(place);
      this.createArcToElement((this.modelService.source_hrany as Place).place, transition.transition, transition, ArcType.REGULAR);
      this.modelService.hybesaprechod = 1;
      this.modelService.hybesamiesto = 0;
      this.modelService.movedprechod = transition;
      this.modelService.movedmiesto = undefined;
      this.controlPanelComponent.getValue().resetFast('move');
      this.canvasService.startAgain.next(false);
    }
  }

  connectDestinationTransition(place: Place): Transition {
    this.modelService.updatePreviousState();
    const transition = new PetriflowTransition(place.place.x, place.place.y, `t${this.modelService.nextTransitionId()}`);
    this.modelService.model.addTransition(transition);
    const graphicTransition = new Transition(transition, []);
    this.modelService.graphicModel.transitions.unshift(graphicTransition);
    this.canvasService.renderTransition(graphicTransition);
    this.canvasService.elementypredhrany(this.modelService.graphicModel);
    this.canvasService.labelypredhranyprve(this.modelService.graphicModel);
    return graphicTransition;
  }

  private removeOldArc() {
    const indexToRemove = this.modelService.model.getArcs().length - 1;
    const graphicalArc = this.modelService.graphicModel.arcs[indexToRemove];
    this.modelService.model.removeArc(graphicalArc.arc.id);
    this.canvasService.canvas.remove(graphicalArc.objektyhrany.polyciarapod);
    this.canvasService.canvas.remove(graphicalArc.objektyhrany.polyciara);
    this.canvasService.canvas.remove(graphicalArc.objektyhrany.sipka);
    this.canvasService.canvas.remove(graphicalArc.objektyhrany.vahaelem);
    graphicalArc.objektyhrany.vahaelem.removeChild(graphicalArc.objektyhrany.vaha);
    this.modelService.graphicModel.arcs.pop();
  }

  private createSvgArcFromElement(x: number, y: number, element: Place | Transition) {
    this.modelService.source_hrany = element;
    this.modelService.kresli_sa_hrana = 1;
    this.modelService.bod.x = x + ModelerConfig.ARROW_HEAD_SIZE; // event.pageX - canvas.getBoundingClientRect().left;
    this.modelService.bod.y = y; // event.pageY - canvas.getBoundingClientRect().top;
    this.modelService.hranabymove = this.controlPanelComponent.getValue().canvasService.novy_svg_temp_arc(element, this.modelService.bod, ArcType.REGULAR);
  }

  private createArcToElement(source: PetriflowTransition | PetriflowPlace, destination: PetriflowTransition | PetriflowPlace, element: Place | Transition, typeOfArc: ArcType) {
    const nextIndex = this.modelService.model.getArcs().length;
    const arc = new PetriflowArc(source.id, destination.id, typeOfArc, `a${this.modelService.nextArcId()}`);
    this.modelService.model.addArc(arc);
    this.lastElement = element;
    this.modelService.graphicModel.arcs[nextIndex] = new Arc(arc, source, destination);
    this.controlPanelComponent.getValue().canvasService.renderArc(this.modelService.graphicModel.arcs[nextIndex]);
    this.controlPanelComponent.getValue().canvasService.elementypredhrany(this.modelService.graphicModel);
    this.controlPanelComponent.getValue().canvasService.labelypredhranyprve(this.modelService.graphicModel);
    this.canvasService.reset();
  }
}
