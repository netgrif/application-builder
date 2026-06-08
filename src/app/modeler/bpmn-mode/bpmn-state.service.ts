import {Injectable} from '@angular/core';

const LS_XML = 'nab_bpmn_diagram';
const LS_FLAG = 'nab_bpmn_is_project';

/**
 * Holds the last BPMN diagram XML so the BPMN editor can restore the diagram
 * when the user navigates away (e.g. to the Petriflow edit/simulation mode) and
 * comes back, and persists it to localStorage so it also survives a reload.
 *
 * `isBpmnProject` marks that the current model originated from / is being edited
 * in BPMN, so the BPMN editor stays reachable after a reload (until the user
 * makes a structural edit in the Petriflow editor, which clears this).
 */
@Injectable({
    providedIn: 'root'
})
export class BpmnStateService {

    private _xml: string | null = null;
    private _isBpmnProject = false;

    /**
     * Label changes (BPMN element id → new label) that the AI assistant applied
     * and that must be written back onto the BPMN diagram on the next BPMN-mode
     * entry. The BPMN element name is the source of truth for a task label, so
     * label edits cannot live in the enrichment store — they are pushed onto the
     * diagram instead. Transient (applied immediately, not persisted).
     */
    pendingLabelOverrides: Map<string, string> | null = null;

    constructor() {
        try {
            this._xml = localStorage.getItem(LS_XML);
            this._isBpmnProject = localStorage.getItem(LS_FLAG) === '1';
        } catch { /* ignore */ }
    }

    get xml(): string | null {
        return this._xml;
    }

    set xml(value: string | null) {
        this._xml = value;
        try {
            if (value) localStorage.setItem(LS_XML, value);
            else localStorage.removeItem(LS_XML);
        } catch { /* ignore */ }
    }

    get isBpmnProject(): boolean {
        return this._isBpmnProject;
    }

    set isBpmnProject(value: boolean) {
        this._isBpmnProject = value;
        try {
            if (value) localStorage.setItem(LS_FLAG, '1');
            else localStorage.removeItem(LS_FLAG);
        } catch { /* ignore */ }
    }

    clear(): void {
        this._xml = null;
        this._isBpmnProject = false;
        this.pendingLabelOverrides = null;
        try {
            localStorage.removeItem(LS_XML);
            localStorage.removeItem(LS_FLAG);
        } catch { /* ignore */ }
    }
}
