// src/app/dialogs/dialog-assistant/models/chat.models.ts

export type Role = 'assistant' | 'user';
export type MsgKind = 'info' | 'thinking' | 'brd' | 'tech' | 'xml';

/** Common structure for all chat messages displayed in the UI */
export interface BaseMsg {
    id: string;
    role: Role;
    kind: MsgKind;
    content?: string;
    tokens?: number;
    latencyMs?: number;
    timestamp: Date;
    error?: string;
    changeLog?: string[];
}

/** Specialized BRD message (business requirement draft) */
export interface BrdMsg extends BaseMsg {
    kind: 'brd';
    brd?: string;
}

/** Specialized TECH message (Petriflow technical spec) */
export interface TechMsg extends BaseMsg {
    kind: 'tech';
    tech?: string;
}

/** Specialized XML message (generated Petriflow XML) */
export interface XmlMsg extends BaseMsg {
    kind: 'xml';
    xml?: string;
    summary?: string;
}

/** Union of all supported chat message types */
export type ChatMsg = BaseMsg | BrdMsg | TechMsg | XmlMsg;

/** Shared state for the currently edited/derived artifacts */
export interface DraftState {
    version: number;
    brd?: string;
    tech?: string;
}

/** Track token usage reported by backend / LLM proxy */
export interface TokenUsage {
    total: number;
}
