import {AiAssistantCurrentContext} from '../ai-assistant.service';

/**
 * Single message rendered as a bubble in the chat UI.
 *
 *   text         — plain text / markdown answer
 *   spinner      — temporary "thinking..." indicator
 *   error        — provider / network / import error
 *   xml-actions  — action row sitting under an XML-containing AI bubble.
 *                  `text` holds the raw XML payload, the bubble renders
 *                  "Apply to canvas" + "Download" + "Show full XML" controls.
 */
export interface AiChatMessage {
    /** Unique id used for trackBy in *ngFor and for targeted bubble updates. */
    id?: number;
    type: 'text' | 'spinner' | 'error' | 'xml-actions';
    text: string;
    reply: boolean;
    date: Date;
    applicationContext: AiAssistantCurrentContext;
}

/**
 * OpenAI Chat Completions / Anthropic Messages style turn.
 * The internal conversation history sent to the provider.
 */
export interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}
