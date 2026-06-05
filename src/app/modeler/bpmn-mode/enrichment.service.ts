import {Injectable} from '@angular/core';
import {
    DataVariable,
    ExportService,
    I18nString,
    ImportService,
    PetriNet,
    Role,
    Transition,
} from '@netgrif/petriflow';
import {transitionIdToActivityKey} from './bpmn-conversion.util';

const LS_KEY = 'nab_bpmn_enrichment';

/**
 * Holds the Petriflow "enrichment" of a BPMN-originated process — everything
 * that is NOT workflow structure: per-task forms, roles, actions, triggers and
 * task properties, plus process-global role and data definitions.
 *
 * The BPMN diagram is the source of truth for the WORKFLOW; this store is the
 * source of truth for the ENRICHMENT. The final Petriflow model is produced by
 * {@link materializeInto}: structure (from bpmn2pn) + enrichment overlaid by
 * activity key. This survives arbitrary workflow edits because enrichment lives
 * here, decoupled from the regenerated structural net.
 *
 * Implementation note: we keep cloned live Petriflow objects (faithful, no DTO
 * mapping that could miss properties) and (de)serialize via a carrier PetriNet
 * using the petriflow Export/Import services.
 */
@Injectable({
    providedIn: 'root'
})
export class EnrichmentService {

    /** activity key (BPMN element id) → cloned Transition carrying its enrichment. */
    private _activities = new Map<string, Transition>();
    /** detached enrichment for removed activities (survives accidental delete+re-add). */
    private _quarantine = new Map<string, Transition>();
    /** process-global role definitions. */
    private _roles = new Map<string, Role>();
    /** process-global data attribute definitions. */
    private _data = new Map<string, DataVariable>();

    /** Set before navigating to /form or /actions; harvested on BPMN re-entry. */
    pendingHarvestTransitionId: string | null = null;

    constructor(
        private _import: ImportService,
        private _export: ExportService,
    ) {
        this._restore();
    }

    get isEmpty(): boolean {
        return this._activities.size === 0 && this._roles.size === 0 && this._data.size === 0;
    }

    get quarantineCount(): number {
        return this._quarantine.size;
    }

    clear(): void {
        this._activities.clear();
        this._quarantine.clear();
        this._roles.clear();
        this._data.clear();
        this.pendingHarvestTransitionId = null;
        this._persist();
    }

    // ─── Harvest: model → store ─────────────────────────────────────────────────

    /**
     * Capture one transition's enrichment plus the process-global roles/data.
     * @param keyOverride pin the enrichment to this activity key regardless of
     *        any id rename done in the edit dialog (BPMN id stays the key).
     */
    harvest(transition: Transition, model: PetriNet, keyOverride?: string): void {
        if (!transition) return;
        const key = keyOverride ?? transitionIdToActivityKey(transition.id);
        const clone = transition.clone();
        clone.id = key;
        this._activities.set(key, clone);
        // revive from quarantine if it was there
        this._quarantine.delete(key);
        this._captureGlobals(model);
        this._persist();
    }

    /** Capture enrichment of every transition in the model (used on BPMN re-entry). */
    harvestAll(model: PetriNet): void {
        if (!model) return;
        model.getTransitions().forEach(t => {
            const key = transitionIdToActivityKey(t.id);
            const clone = t.clone();
            clone.id = key;
            this._activities.set(key, clone);
            this._quarantine.delete(key);
        });
        this._captureGlobals(model);
        this._persist();
    }

    private _captureGlobals(model: PetriNet): void {
        if (!model) return;
        model.getRoles().forEach(r => this._roles.set(r.id, r.clone()));
        model.getDataSet().forEach(d => this._data.set(d.id, d.clone()));
    }

    // ─── Materialize: store → model ─────────────────────────────────────────────

    /**
     * Overlay the stored enrichment onto a freshly-converted structural net.
     * Pure with respect to the store (only reads it); mutates the given net.
     */
    materializeInto(net: PetriNet): void {
        if (!net) return;

        // Inject process-global definitions the structural net doesn't carry.
        this._roles.forEach(r => { if (!net.getRole(r.id)) net.addRole(r.clone()); });
        this._data.forEach(d => { if (!net.getData(d.id)) net.addData(d.clone()); });

        net.getTransitions().forEach(t => {
            const key = transitionIdToActivityKey(t.id);
            const e = this._activities.get(key);
            if (!e) return; // new activity → stays empty, correct by construction

            // One deep clone gives fresh copies of every nested object (triggers,
            // refs, dataGroups, eventSource) with no shared refs back into the store.
            const src = e.clone();
            t.triggers     = src.triggers;
            t.roleRefs     = src.roleRefs;
            t.userRefs     = src.userRefs;
            t.dataGroups   = src.dataGroups;
            t.eventSource  = src.eventSource;
            t.assignPolicy = src.assignPolicy;
            t.finishPolicy = src.finishPolicy;
            if (src.icon !== undefined)     t.icon = src.icon;
            if (src.priority !== undefined) t.priority = src.priority;
            // NOTE: label is intentionally NOT overlaid — BPMN is the source of
            // truth for the workflow, so the structural (BPMN) label wins.
        });
    }

    /**
     * Garbage-collect enrichment for activities no longer present in the diagram.
     * Detached entries go to quarantine so an accidental delete+re-add recovers.
     */
    gc(currentActivityKeys: Set<string>): void {
        let changed = false;
        for (const key of [...this._activities.keys()]) {
            if (!currentActivityKeys.has(key)) {
                this._quarantine.set(key, this._activities.get(key)!);
                this._activities.delete(key);
                changed = true;
            }
        }
        if (changed) this._persist();
    }

    // ─── Persistence (survives reload) ──────────────────────────────────────────

    /** Build a carrier PetriNet that holds all enrichment for serialization. */
    private _toCarrier(): PetriNet {
        const net = new PetriNet();
        net.id = 'enrichment';
        net.title = new I18nString('enrichment');
        this._roles.forEach(r => net.addRole(r.clone()));
        this._data.forEach(d => net.addData(d.clone()));
        this._activities.forEach(t => net.addTransition(t.clone()));
        return net;
    }

    private _persist(): void {
        try {
            if (this.isEmpty) {
                localStorage.removeItem(LS_KEY);
                return;
            }
            const xml = this._export.exportXml(this._toCarrier());
            localStorage.setItem(LS_KEY, xml);
        } catch (e) {
            console.warn('[Enrichment] persist failed', e);
        }
    }

    private _restore(): void {
        try {
            const xml = localStorage.getItem(LS_KEY);
            if (!xml) return;
            const res = this._import.parseFromXml(xml);
            if (!res.model) return;
            res.model.getRoles().forEach(r => this._roles.set(r.id, r.clone()));
            res.model.getDataSet().forEach(d => this._data.set(d.id, d.clone()));
            res.model.getTransitions().forEach(t => this._activities.set(t.id, t.clone()));
        } catch (e) {
            console.warn('[Enrichment] restore failed', e);
        }
    }
}
