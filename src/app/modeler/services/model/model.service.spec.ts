import {Injector} from '@angular/core';
import {I18nString, PetriNet, Place, ProcessPermissionRef, Role, Transition} from '@netgrif/petriflow';
import {ArcFactory} from '../../edit-mode/domain/arc-builders/arc-factory.service';
import {PlaceChange} from '../../history-mode/model/place/place-change';
import {ChangedTransition} from '../../../dialogs/dialog-transition-edit/changed-transition';
import {ChangedRole} from '../../role-mode/role-detail/changed-role';
import {ModelService} from './model.service';

describe('ModelService', () => {
    let service: ModelService;

    beforeEach(() => {
        service = new ModelService({} as ArcFactory, {} as Injector);
    });

    it('emits the current model before replacing it', () => {
        const first = new PetriNet();
        const second = new PetriNet();
        const emitted: Array<PetriNet> = [];
        service.modelWillChange.subscribe(model => emitted.push(model));

        service.model = first;
        service.model = second;
        service.model = second;
        service.model = undefined;

        expect(emitted).toEqual([first, second]);
    });

    it('keeps place order when editing or renaming a place', () => {
        const model = new PetriNet();
        const first = new Place(0, 0, false, 'first');
        const middle = new Place(0, 0, false, 'middle');
        const last = new Place(0, 0, false, 'last');
        model.addPlace(first);
        model.addPlace(middle);
        model.addPlace(last);
        service.model = model;
        const original = middle.clone();
        const edited = middle.clone();
        edited.id = 'renamed';
        edited.label = new I18nString('Changed');

        service.updatePlace(new PlaceChange(original, edited, model));

        expect(model.getPlaces().map(place => place.id)).toEqual(['first', 'renamed', 'last']);
        expect(model.getPlace('renamed').label.value).toBe('Changed');
    });

    it('keeps transition order when editing or renaming a transition', () => {
        const model = new PetriNet();
        const first = new Transition(0, 0, 'first');
        const middle = new Transition(0, 0, 'middle');
        const last = new Transition(0, 0, 'last');
        model.addTransition(first);
        model.addTransition(middle);
        model.addTransition(last);
        service.model = model;
        const edited = middle.clone();
        edited.id = 'renamed';
        edited.label = new I18nString('Changed');

        service.updateTransition(new ChangedTransition(model, edited, 'middle'));

        expect(model.getTransitions().map(transition => transition.id)).toEqual(['first', 'renamed', 'last']);
        expect(model.getTransition('renamed').label.value).toBe('Changed');
    });

    it('keeps role order and permission-reference order when renaming a role', () => {
        const model = new PetriNet();
        const first = new Role('first');
        const middle = new Role('middle');
        const last = new Role('last');
        model.addRole(first);
        model.addRole(middle);
        model.addRole(last);
        ['first', 'middle', 'last'].forEach(id => model.addRoleRef(new ProcessPermissionRef(id)));
        service.model = model;
        const edited = middle.clone();
        edited.id = 'renamed';
        edited.title = new I18nString('Changed');

        service.updateRole(new ChangedRole(edited, 'middle', model));

        expect(model.getRoles().map(role => role.id)).toEqual(['first', 'renamed', 'last']);
        expect(model.getRoleRefs().map(roleRef => roleRef.id)).toEqual(['first', 'renamed', 'last']);
        expect(model.getRole('renamed').title.value).toBe('Changed');
    });
});
