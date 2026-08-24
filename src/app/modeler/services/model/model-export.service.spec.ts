import {
    Action,
    EventPhase,
    ExportService,
    PetriNet,
    Transition,
    TransitionEvent,
    TransitionEventType
} from '@netgrif/petriflow';
import {MatDialog} from '@angular/material/dialog';
import {ModelExportService} from './model-export.service';
import {ModelService} from './model.service';
import {ModelSourceService} from './model-source.service';
import {collectActions} from '../../actions-mode/action-editor/action-id-utils';

describe('ModelExportService', () => {
    it('normalizes duplicate action ids on an export clone', () => {
        const model = new PetriNet();
        const firstTransition = new Transition(0, 0, 'first');
        const firstEvent = new TransitionEvent(TransitionEventType.FINISH, 'first_finish');
        firstEvent.addAction(new Action('1', 'first'), EventPhase.PRE);
        firstTransition.eventSource.addEvent(firstEvent);
        model.addTransition(firstTransition);

        const secondTransition = new Transition(0, 0, 'second');
        const secondEvent = new TransitionEvent(TransitionEventType.FINISH, 'second_finish');
        secondEvent.addAction(new Action('1', 'duplicate'), EventPhase.PRE);
        secondTransition.eventSource.addEvent(secondEvent);
        model.addTransition(secondTransition);

        let exportedModel: PetriNet;
        const exportService = {
            exportXml: (value: PetriNet) => {
                exportedModel = value;
                return '<document/>';
            },
        } as ExportService;
        const service = new ModelExportService(
            {} as ModelService,
            {} as ModelSourceService,
            exportService,
            {} as MatDialog,
        );

        service.exportXml(model);

        expect(collectActions(exportedModel).map(action => action.id)).toEqual(['1', '2']);
        expect(collectActions(model).map(action => action.id)).toEqual(['1', '1']);
    });
});
