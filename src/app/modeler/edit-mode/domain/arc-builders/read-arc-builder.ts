import {ArcBuilder} from './arc-builder';
import {PetriflowReadArc} from '@netgrif/petriflow.svg';
import {Place, ReadArc, Transition} from '@netgrif/petriflow';
import {Place as SvgPlace, ReadArc as SvgReadArc, Transition as SvgTransition} from '@netgrif/petri.svg';

export class ReadArcBuilder extends ArcBuilder<PetriflowReadArc, ReadArc> {

    public modelArc(id: string, source: Place, target: Transition): ReadArc {
        return new ReadArc(source, target, id);
    }

    public svgArc(id: string, source: SvgPlace, target: SvgTransition): PetriflowReadArc {
        return new PetriflowReadArc(new SvgReadArc(id, source, target));
    }
}
