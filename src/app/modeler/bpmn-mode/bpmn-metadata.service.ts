import {Injectable} from '@angular/core';
import {TriggerType} from '@netgrif/petriflow';

export interface BpmnTaskMeta {
    triggerType: TriggerType;
    roleIds: string[];
}

/**
 * Stores Petriflow task properties keyed by BPMN element ID.
 * Survives BPMN diagram edits as long as element IDs remain stable.
 */
@Injectable({
    providedIn: 'root'
})
export class BpmnMetadataService {

    private readonly _meta = new Map<string, BpmnTaskMeta>();

    get(bpmnId: string): BpmnTaskMeta | undefined {
        return this._meta.get(bpmnId);
    }

    getOrDefault(bpmnId: string): BpmnTaskMeta {
        return this._meta.get(bpmnId) ?? {triggerType: TriggerType.USER, roleIds: []};
    }

    set(bpmnId: string, meta: BpmnTaskMeta): void {
        this._meta.set(bpmnId, {...meta});
    }

    delete(bpmnId: string): void {
        this._meta.delete(bpmnId);
    }

    clear(): void {
        this._meta.clear();
    }

    /** All stored entries — used when merging metadata into a converted PetriNet. */
    entries(): IterableIterator<[string, BpmnTaskMeta]> {
        return this._meta.entries();
    }

    toJSON(): Record<string, BpmnTaskMeta> {
        const obj: Record<string, BpmnTaskMeta> = {};
        this._meta.forEach((v, k) => { obj[k] = v; });
        return obj;
    }

    fromJSON(json: Record<string, BpmnTaskMeta>): void {
        this._meta.clear();
        Object.entries(json).forEach(([k, v]) => this._meta.set(k, v));
    }
}
