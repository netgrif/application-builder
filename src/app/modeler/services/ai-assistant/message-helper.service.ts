import {Injectable} from '@angular/core';
import {AiAssistantCurrentContext} from './ai-assistant.service';
import {AiChatMessage} from './domain/message-objects';

@Injectable({
    providedIn: 'root'
})
export class MessageHelperService {

    public shouldBeRemoved(message: AiChatMessage): boolean {
        return message.type === 'spinner';
    }

    public constructErrorMessage(reason: any, context: AiAssistantCurrentContext): AiChatMessage {
        const text = typeof reason === 'string' ? reason : (reason?.message ?? JSON.stringify(reason));
        return this.constructMessage('error', text, true, context);
    }

    public constructMessage(
        type: AiChatMessage['type'],
        message: string,
        reply: boolean,
        messageContext: AiAssistantCurrentContext,
        dateTime: Date = new Date()
    ): AiChatMessage {
        return {
            type,
            text: message,
            reply,
            date: dateTime,
            applicationContext: messageContext
        };
    }
}
