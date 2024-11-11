import {Injectable} from '@angular/core';
import {InhibitorArcBuilder} from './inhibitor-arc-builder';
import {Arc, ArcType, NodeElement} from '@netgrif/petriflow';
import {ReadArcBuilder} from './read-arc-builder';
import {AbstractRegistry} from '../../../abstract-registry';
import {ArcBuilder} from './arc-builder';
import {ResetArcBuilder} from './reset-arc-builder';
import {RegularPTArcBuilder} from './regular-p-t-arc-builder';
import {PetriflowArc} from '@netgrif/petriflow.svg';
import {RegularTPArcBuilder} from './regular-tparc-builder';
import {NodeElement as SvgNodeElement} from '@netgrif/petri.svg';

@Injectable({
    providedIn: 'root'
})
export class ArcFactory extends AbstractRegistry<ArcBuilder<PetriflowArc<any>, Arc<any, any>>> {

    constructor() {
        super();
        this.registerItem(new RegularPTArcBuilder(ArcType.REGULAR_PT));
        this.registerItem(new RegularTPArcBuilder(ArcType.REGULAR_TP));
        this.registerItem(new InhibitorArcBuilder(ArcType.INHIBITOR));
        this.registerItem(new ReadArcBuilder(ArcType.READ));
        this.registerItem(new ResetArcBuilder(ArcType.RESET));
    }

    public buildArc(type: ArcType, id: string, source: NodeElement, destination: NodeElement): Arc<NodeElement, NodeElement> {
        return this.getItem(type).modelArc(id, source, destination);
    }

    public buildSvgArc(type: ArcType, id: string, source: SvgNodeElement, destination: SvgNodeElement): PetriflowArc<any> {
        return this.getItem(type).svgArc(id, source, destination);
    }
}
