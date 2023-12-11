import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FastPnService} from '../fast-pn.service';
import {ModelService} from '../../services/model.service';
import {CanvasService} from '../../services/canvas.service';
import {ArcType} from '@netgrif/petriflow';
import {Place} from '../../classes/place/place';
import {Transition} from '../../classes/transition/transition';

@Component({
    selector: 'nab-fast-mode-context',
    templateUrl: './fast-mode-context.component.html',
    styleUrls: ['./fast-mode-context.component.scss']
})
export class FastModeContextComponent implements OnInit {

    @ViewChild('fastContext') fastContext: ElementRef<HTMLElement>;

    elementType: string;

    constructor(private modelService: ModelService,
                public canvasService: CanvasService,
                private fastPnService: FastPnService) {
    }

    ngOnInit(): void {
        this.fastPnService.fastModeContext.next(this);
    }

    useRegularArc() {
        this.useArc(ArcType.REGULAR);
    }

    useResetArc() {
        this.useArc(ArcType.RESET);
    }

    useInhibitorArc() {
        this.useArc(ArcType.INHIBITOR);
    }

    useReadArc() {
        this.useArc(ArcType.READ);
    }

    useArc(typeOfArc: ArcType) {
        if (typeOfArc === ArcType.REGULAR) {
            this.canvasService.afterContextClose = true;
        }
        this.fastPnService.connectToExistingElement(typeOfArc);
        this.modelService.pocetmousedownright = 0;
        this.hideComponent();
        this.canvasService.afterContextClose = true;
        this.modelService.pocetmousedownposuvtran = 1;
        this.canvasService.hasBeenDone = false;
    }

    showComponent($event): void {
        if (this.fastContext.nativeElement !== undefined && this.canvasService.isCustomFastPn && this.modelService.hybesaprechod === 1) {
            this.fastContext.nativeElement.style.visibility = 'visible';
            this.fastContext.nativeElement.style.opacity = '1';
            this.fastContext.nativeElement.style.left = $event.clientX + 15 + 'px';
            this.fastContext.nativeElement.style.top = $event.clientY + 15 + 'px';
        }
        if (this.fastPnService.preEndLastElement) {
            this.elementType = this.fastPnService.preEndLastElement.type;
        }
    }

    hideComponent(): void {
        if (this.fastContext !== undefined) {
            this.fastContext.nativeElement.style.visibility = 'hidden';
            this.fastContext.nativeElement.style.opacity = '0';
        }
    }

    mouseClickCounter(event) {
        if (event.button === 2) {
            this.modelService.pocetmousedownright++;
            if (this.modelService.pocetmousedownright === 2) {
                this.stopFastPn();
            }
        }
    }

    stopFastPn(): void {
        const lastElement = this.fastPnService.lastElement;
        if (!lastElement) {
            this.resetFastPn();
            this.fastPnService.actualMode = undefined;
        } else if (lastElement instanceof Transition) {
            this.removeTransition(lastElement);
        } else if (lastElement instanceof Place) {
            this.removePlace(lastElement);
        }
        this.canvasService.isCustomFastPn.next(true);
        this.canvasService.startAgain.next(true);
        this.canvasService.isActiveFastPn.next(true);
        this.fastPnService.controlPanelComponent.value.resetFast('place');
        this.fastPnService.preEndLastElement = undefined;
        this.fastPnService.lastElement = undefined;
    }

    removePlace(place: Place) {
        this.resetFastPn();
        const j = this.modelService.graphicModel.places.indexOf(place);
        this.modelService.graphicModel.places.splice(j, 1);
        this.modelService.model.removePlace(place.place.id);
        this.canvasService.removeElementArcs(place, place.place.id);
        this.canvasService.canvas.remove(place.objektymiesta.element);
        place.objektymiesta.menoelem.removeChild(place.objektymiesta.meno);
        this.canvasService.canvas.remove(place.objektymiesta.menoelem);
        this.canvasService.canvas.remove(place.objektymiesta.svgmarking);
        for (const token of place.markingtokens) {
            this.canvasService.canvas.remove(token);
        }
        place.objektymiesta.svgmarking.removeChild(place.objektymiesta.markingnode);
        this.canvasService.canvas.remove(place.objektymiesta.zamenom);
        this.fastPnService.lastElement = undefined;
        this.modelService.placeId--;
    }

    removeTransition(transition) {
        this.resetFastPn();
        const j = this.modelService.graphicModel.transitions.indexOf(transition);
        this.modelService.graphicModel.transitions.splice(j, 1);
        this.modelService.model.removeTransition(transition.transition.id);
        this.canvasService.removeElementArcs(transition, transition.transition.id);
        this.canvasService.canvas.remove(transition.objektyelementu.element);
        this.canvasService.canvas.remove(transition.objektyelementu.zamenom);
        this.canvasService.canvas.remove(transition.objektyelementu.cancelArrow);
        this.canvasService.canvas.remove(transition.objektyelementu.finishArrow);
        transition.objektyelementu.menoelem.removeChild(transition.objektyelementu.meno);
        this.canvasService.canvas.remove(transition.objektyelementu.menoelem);
        this.fastPnService.lastElement = undefined;
        this.modelService.transitionId--;
    }

    private resetFastPn() {
        this.modelService.pocetmousedownposuvplace = 0;
        this.modelService.hybesamiesto = 0;
        this.modelService.pocetmousedownposuvtran = 0;
        this.modelService.hybesaprechod = 0;
        this.modelService.updatePreviousState();
        this.modelService.movedmiesto = undefined;
        this.modelService.movedprechod = undefined;
        this.canvasService.fastPnService.controlPanelComponent.getValue().sideNav();
        this.hideComponent();
    }
}
