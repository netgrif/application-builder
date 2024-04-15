import {Injectable} from '@angular/core';
import {ChangeMessageResolver} from './change-message-resolver';
import {ChangedPlace} from '../../../dialogs/dialog-place-edit/changed-place';
import {PlaceChangeType} from '../../../dialogs/dialog-place-edit/place-change-type';

@Injectable({
    providedIn: 'root'
})
export class PlaceChangeMessageResolverService implements ChangeMessageResolver<ChangedPlace> {

    resolve(change: ChangedPlace): string {
        switch (change.type) {
            case PlaceChangeType.CREATE:
                return `New place ${change.id} created`;
            case PlaceChangeType.DELETE:
                return `Place ${change.id} deleted`;
            case PlaceChangeType.MOVE:
                return `Place ${change.id} moved`;
            case PlaceChangeType.ADD_TOKEN:
                return `Added token to place ${change.id}`;
            case PlaceChangeType.REMOVE_TOKEN:
                return `Removed token from place ${change.id}`;
            case PlaceChangeType.EDIT:
            default:
                return `Place ${change.id} attributes changed`;
        }
    }
}
