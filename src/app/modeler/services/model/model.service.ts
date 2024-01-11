import {Injectable} from '@angular/core';
import {
    Arc,
    ArcType,
    Breakpoint,
    DataType,
    DataVariable,
    I18nString,
    NodeElement,
    PetriNet,
    Place,
    Transition
} from '@netgrif/petriflow';
import {ModelConfig} from './model-config';
import {CanvasConfiguration} from '@netgrif/petri.svg';
import {BehaviorSubject, Subject} from 'rxjs';
import {ChangedPlace} from '../../../dialogs/dialog-place-edit/changed-place';
import {ChangedTransition} from 'src/app/dialogs/dialog-transition-edit/changed-transition';
import {ChangedArc} from '../../../dialogs/dialog-arc-edit/changed-arc';
import {SequenceGenerator} from './sequence-generator';
import {ArcFactory} from '../../edit-mode/domain/arc-builders/arc-factory.service';
import {ModelerConfig} from '../../modeler-config';
import {ChangedPetriNet} from '../../../dialogs/dialog-model-edit/changed-petri-net';
import {ModelSource} from './model-source';

@Injectable({
    providedIn: 'root'
})
export class ModelService implements ModelSource {
    private readonly _model: BehaviorSubject<PetriNet>;
    private readonly _placeChange: Subject<ChangedPlace>;
    private readonly _transitionChange: Subject<ChangedTransition>;
    private readonly _arcChange: Subject<ChangedArc>;
    private readonly _bulkChange: Subject<void>;

    private _placeIdSequence = new SequenceGenerator('p');
    private _transitionIdSequence = new SequenceGenerator('t');
    private _arcIdSequence = new SequenceGenerator('a');
    private _dataIdSequence = new SequenceGenerator('data');

    constructor(
        private arcFactory: ArcFactory
    ) {
        this._model = new BehaviorSubject<PetriNet>(this.newModel());
        this._placeChange = new Subject<ChangedPlace>();
        this._transitionChange = new Subject<ChangedTransition>();
        this._arcChange = new Subject<ChangedArc>();
        this._bulkChange = new Subject<void>();
    }

    set model(newModel: PetriNet) {
        this.alignModel(newModel);
        this._model.next(newModel);
        this._placeIdSequence.reset(newModel.getPlaces());
        this._transitionIdSequence.reset(newModel.getTransitions());
        this._arcIdSequence.reset(newModel.getArcs());
        this._dataIdSequence.reset(newModel.getDataSet());
    }

    get model(): PetriNet {
        return this._model.value;
    }

    get modelSubject(): BehaviorSubject<PetriNet> {
        return this._model;
    }

    newModel(): PetriNet {
        const model = new PetriNet();
        model.id = ModelConfig.IDENTIFIER;
        model.title = new I18nString(ModelConfig.TITLE);
        model.initials = ModelConfig.INITIALS;
        model.icon = ModelConfig.ICON;
        return model;
    }

    updateModel(changedModel: ChangedPetriNet): void {
        this.model.id = changedModel.model.id;
        this.model.title = changedModel.model.title;
        this.model.initials = changedModel.model.initials;
        this.model.icon = changedModel.model.icon;
        this.model.defaultRole = changedModel.model.defaultRole;
        this.model.anonymousRole = changedModel.model.anonymousRole;
        this.model.caseName = changedModel.model.caseName;
    }

    // PLACE

    public newPlace(x: number, y: number): Place {
        const place = new Place(
            this.alignPositionCoordinate(x, CanvasConfiguration.WIDTH),
            this.alignPositionCoordinate(y, CanvasConfiguration.HEIGHT),
            false,
            this.nextPlaceId()
        );
        if (this.model.getPlaces().length === 0) {
            place.marking = 1;
        }
        this.addPlace(place);
        return place;
    }

    public copyPlace(copy: Place): Place {
        const place = copy.clone();
        place.id = this.nextPlaceId();
        place.x += ModelerConfig.SIZE;
        place.y += ModelerConfig.SIZE;
        this.addPlace(place);
        return place;
    }

    private addPlace(place: Place): void {
        this.model.addPlace(place);
        this.model.lastChanged++;
        this._placeChange.next(new ChangedPlace(this.model.clone(), place));
    }

    public updatePlace(newPlace: ChangedPlace): void {
        if (!newPlace) {
            return;
        }
        // TODO: NAB-326 validate unique id
        const place = this.model.getPlace(newPlace.id);
        place.id = newPlace.place.id;
        place.marking = newPlace.place.marking;
        place.label = newPlace.place.label;
        this.model.removePlace(newPlace.id);
        this.model.addPlace(place);
        this.model.getArcs()
            .filter(arc => arc.reference === newPlace.id)
            .forEach(arc => arc.reference = place.id);
        this.model.lastChanged++;
        this._placeChange.next(new ChangedPlace(this.model.clone(), place, newPlace.id));
    }

    public movePlace(place: Place, position: DOMPoint): void {
        place.x = this.alignPositionX(position.x);
        place.y = this.alignPositionY(position.y);
        this.model.lastChanged++;
        this._placeChange.next(new ChangedPlace(this.model.clone(), place));
    }

    public removePlace(place: Place): void {
        this.model.getArcs()
            .filter(arc => arc.source === place || arc.destination === place)
            .forEach(arc => this.removeArc(arc));
        this.model.getArcs()
            .filter(arc => arc.reference === place.id)
            .forEach(arc => {
                arc.reference = undefined;
                arc.multiplicity = 1;
            });
        this.model.removePlace(place.id);
        this.model.lastChanged++;
        this._placeChange.next(new ChangedPlace(this.model.clone(), undefined, place.id));
    }

    // TRANSITION

    public newTransition(x: number, y: number): Transition {
        const transition = new Transition(
            this.alignPositionCoordinate(x, CanvasConfiguration.WIDTH),
            this.alignPositionCoordinate(y, CanvasConfiguration.HEIGHT),
            this.nextTransitionId()
        );
        this.addTransition(transition);
        return transition;
    }

    public copyTransition(copy: Transition): Transition {
        const transition = copy.clone();
        transition.id = this.nextTransitionId();
        transition.x += ModelerConfig.SIZE;
        transition.y += ModelerConfig.SIZE;
        this.addTransition(transition);
        return transition;
    }

    private addTransition(transition: Transition) {
        this.model.addTransition(transition);
        this.model.lastChanged++;
        this._transitionChange.next(new ChangedTransition(this.model.clone(), transition));
    }

    public updateTransition(newTransition: ChangedTransition): void {
        if (!newTransition) {
            return;
        }
        // TODO: NAB-326 validate unique id
        const transition = this.model.getTransition(newTransition.id);
        transition.id = newTransition.transition.id;
        transition.label = newTransition.transition.label;
        transition.icon = newTransition.transition.icon;
        // TODO: NAB-326 copy attributes
        this.model.removeTransition(newTransition.id);
        this.model.addTransition(transition);
        this.model.lastChanged++;
        this._transitionChange.next(new ChangedTransition(this.model.clone(), transition, newTransition.id));
    }

    public moveTransition(transition: Transition, position: DOMPoint): void {
        transition.x = this.alignPositionX(position.x);
        transition.y = this.alignPositionY(position.y);
        this.model.lastChanged++;
        this._transitionChange.next(new ChangedTransition(this.model.clone(), transition));
    }

    public removeTransition(transition: Transition): void {
        this.model.getArcs()
            .filter(arc => arc.source === transition || arc.destination === transition)
            .forEach(arc => this.removeArc(arc));
        this.model.removeTransition(transition.id);
        this.model.lastChanged++;
        this._transitionChange.next(new ChangedTransition(this.model.clone(), undefined, transition.id));
    }

    // ARC

    public newArc(source: NodeElement, destination: NodeElement, type: ArcType): Arc<NodeElement, NodeElement> {
        const arc = this.arcFactory.buildArc(type, this.nextArcId(), source, destination);
        this.addArc(arc);
        return arc;
    }

    public copyArc(copy: Arc<NodeElement, NodeElement>, sourceId: string, destinationId: string): Arc<NodeElement, NodeElement> {
        const arc = copy.clone();
        arc.id = this.nextArcId();
        arc.breakpoints.forEach(bp => {
            bp.x += ModelerConfig.SIZE;
            bp.y += ModelerConfig.SIZE;
        });
        arc.source = arc.type === ArcType.REGULAR_TP ? this.model.getTransition(sourceId) : this.model.getPlace(sourceId);
        arc.destination = arc.type === ArcType.REGULAR_TP ? this.model.getPlace(destinationId) : this.model.getTransition(destinationId);
        this.addArc(arc);
        return arc;
    }

    public updateArc(newArc: ChangedArc): Arc<NodeElement, NodeElement> {
        if (!newArc) {
            return;
        }
        let arc = this.model.getArc(newArc.id);
        if (newArc.arcType !== arc.type) {
            arc = this.arcFactory.buildArc(newArc.arcType, arc.id, arc.source, arc.destination);
            this.model.removeArc(arc.id);
            this.model.addArc(arc);
        }
        arc.multiplicity = newArc.arc.multiplicity;
        arc.reference = newArc.arc.reference;
        arc.breakpoints = newArc.arc.breakpoints;
        this.model.lastChanged++;
        this._arcChange.next(new ChangedArc(this.model.clone(), arc));
        return arc;
    }

    public newArcBreakpoint(arc: Arc<NodeElement, NodeElement>, position: DOMPoint, index: number,): void {
        const breakPoint = new Breakpoint(
            this.alignPositionX(position.x),
            this.alignPositionY(position.y)
        );
        arc.breakpoints.splice(index, 0, breakPoint);
        this.model.lastChanged++;
        this._arcChange.next(new ChangedArc(this.model.clone(), arc));
    }

    public moveArcBreakpoint(arc: Arc<NodeElement, NodeElement>, index: number, position: DOMPoint): void {
        position = this.alignPosition(position);
        // TODO: NAB-327 breakpoint undefined?
        arc.breakpoints[index].x = position.x;
        arc.breakpoints[index].y = position.y;
        this.model.lastChanged++;
        this._arcChange.next(new ChangedArc(this.model.clone(), arc));
    }

    public removeArcBreakpoint(arc: Arc<NodeElement, NodeElement>, index: number): void {
        arc.breakpoints.splice(index, 1);
        this.model.lastChanged++;
        this._arcChange.next(new ChangedArc(this.model.clone(), arc));
    }

    private addArc(arc: Arc<NodeElement, NodeElement>) {
        this.model.addArc(arc);
        this.model.lastChanged++;
        this._arcChange.next(new ChangedArc(this.model.clone(), arc));
    }

    public removeArc(arc: Arc<NodeElement, NodeElement>): void {
        this.model.removeArc(arc.id);
        this.model.lastChanged++;
        this._arcChange.next(new ChangedArc(this.model.clone(), undefined, arc.id));
    }

    // DATA

    public removeDataVariable(data: DataVariable): void {
        if (data.type === DataType.USER_LIST && this.model.getUserRef(data.id)) {
            this.model.removeUserRef(data.id);
        }
        this.model.getTransitions().forEach(t => {
            t.dataGroups
                .filter(group => group.getDataRef(data.id))
                .forEach(group => group.removeDataRef(data.id));
            if (data.type === DataType.USER_LIST && t.userRefs) {
                t.userRefs = t.userRefs.filter(ref => ref.id !== data.id);
            }
        });
        this.model.getArcs()
            .filter(a => a.reference === data.id)
            .forEach(a => {
                a.reference = undefined;
                a.multiplicity = 1;
            });
        this.model.removeData(data.id);
    }

    // utils

    public nextPlaceId(): string {
        return this._placeIdSequence.next();
    }

    public nextTransitionId(): string {
        return this._transitionIdSequence.next();
    }

    public nextArcId(): string {
        return this._arcIdSequence.next();
    }

    public nextDataId(): string {
        return this._dataIdSequence.next();
    }

    public alignModel(model = this.model): void {
        [...model.getPlaces(), ...model.getTransitions()].forEach(node => {
            node.x = this.alignPositionX(node.x);
            node.y = this.alignPositionY(node.y);
        });
        model.getArcs().forEach(a => {
            a.breakpoints.forEach(bp => {
                bp.x = this.alignPositionX(bp.x);
                bp.y = this.alignPositionY(bp.y);
            });
        });
    }

    public alignPosition(position: DOMPoint): DOMPoint {
        return new DOMPoint(
            this.alignPositionX(position.x),
            this.alignPositionY(position.y)
        );
    }

    public alignPositionX(x: number): number {
        return this.alignPositionCoordinate(x, ModelerConfig.MAX_WIDTH);
    }

    public alignPositionY(y: number): number {
        return this.alignPositionCoordinate(y, ModelerConfig.MAX_HEIGHT);
    }

    public alignPositionCoordinate(originalPosition: number, maxCoordinate: number): number {
        let newPosition = Math.round(originalPosition / ModelerConfig.SIZE) * ModelerConfig.SIZE;
        newPosition = originalPosition < newPosition ? newPosition - ModelerConfig.SIZE / 2 : newPosition + ModelerConfig.SIZE / 2;
        if (newPosition < 0) {
            newPosition += ModelerConfig.SIZE;
        } else if (newPosition > maxCoordinate) {
            newPosition -= ModelerConfig.SIZE;
        }
        return newPosition;
    }

    public getReferenceValue(id: string): number {
        // TODO: NAB-326 probably move to petriflow.js
        const referencedData = this.model.getData(id);
        if (referencedData) {
            if (referencedData.init.value) {
                return Number(referencedData.init.value);
                // TODO: NAB-326 check if isFinite and >= 0
            }
            return 0;
        }
        const referencedPlace = this.model.getPlace(id);
        if (referencedPlace) {
            return referencedPlace.marking;
        }
        return 0;
    }

    get placeChange(): Subject<ChangedPlace> {
        return this._placeChange;
    }

    get transitionChange(): Subject<ChangedTransition> {
        return this._transitionChange;
    }

    get arcChange(): Subject<ChangedArc> {
        return this._arcChange;
    }

    numberOfActions(): number {
        const caseEvents = this.model.getCaseEvents()
            .map(e => e.preActions.length + e.postActions.length)
            .reduce((sum, current) => sum + current, 0);
        const processEvents = this.model.getProcessEvents()
            .map(e => e.preActions.length + e.postActions.length)
            .reduce((sum, current) => sum + current, 0);
        return caseEvents + processEvents;
    }

    numberOfPermissions(): number {
        const rolePermissions = this.model.getRoleRefs()
            .map(ref => {
                return (ref.caseLogic.view !== undefined || ref.caseLogic.create !== undefined || ref.caseLogic.delete !== undefined) ? 1 : 0;
            }).reduce((sum, current) => sum + current, 0);
        const userPermission = this.model.getUserRefs()
            .map(ref => {
                return (ref.caseLogic.view !== undefined || ref.caseLogic.create !== undefined || ref.caseLogic.delete !== undefined) ? 1 : 0;
            }).reduce((sum, current) => sum + current, 0);
        return rolePermissions + userPermission;
    }

    numberOfTransitionActions(transition: Transition): number {
        const eventActions = transition.eventSource.getEvents()
            .map(e => e.preActions.length + e.postActions.length)
            .reduce((sum, current) => sum + current, 0);
        const dataRefActions = transition.dataGroups
            .map(dg =>
                dg.getDataRefs()
                    .map(ref =>
                        ref.getEvents().map(e => e.preActions.length + e.postActions.length).reduce((sum, current) => sum + current, 0)
                    ).reduce((sum, current) => sum + current, 0)
            ).reduce((sum, current) => sum + current, 0);
        return eventActions + dataRefActions;
    }

    numberOfTransitionPermissions(transition: Transition): number {
        const rolePermissions = transition.roleRefs
            .map(ref => {
                return (ref.logic.cancel !== undefined || ref.logic.view !== undefined || ref.logic.assign !== undefined || ref.logic.perform !== undefined || ref.logic.delegate !== undefined) ? 1 : 0;
            }).reduce((sum, current) => sum + current, 0);
        const userPermission = transition.userRefs
            .map(ref => {
                return (ref.logic.cancel !== undefined || ref.logic.view !== undefined || ref.logic.assign !== undefined || ref.logic.perform !== undefined || ref.logic.delegate !== undefined) ? 1 : 0;
            }).reduce((sum, current) => sum + current, 0);
        return rolePermissions + userPermission;
    }
}