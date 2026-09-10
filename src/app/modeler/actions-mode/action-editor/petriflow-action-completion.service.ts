import {Injectable} from '@angular/core';
import {ModelService} from '../../services/model/model.service';
import {actionCompletionProvider} from './definitions/completion-provider';

declare const monaco: any;

@Injectable({providedIn: 'root'})
export class PetriflowActionCompletionService {
    private registration: {dispose(): void};

    constructor(private modelService: ModelService) {
    }

    register(): {dispose(): void} {
        if (!this.registration) {
            this.registration = monaco.languages.registerCompletionItemProvider('petriflow', {
                triggerCharacters: ['.', ':'],
                provideCompletionItems: (model, position) => actionCompletionProvider(
                    model,
                    position,
                    monaco.languages,
                    this.modelService.model,
                ),
            });
        }
        return this.registration;
    }
}
