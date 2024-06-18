import {Event} from '@netgrif/petriflow';

export class ModelerUtils {

    public static numberOfEventActions(events: Array<Event<any>>): number {
        return events.map(e => e.preActions.length + e.postActions.length)
            .reduce((sum, current) => sum + current, 0);
    }
}
