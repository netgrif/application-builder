import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient, HttpClientModule, HttpErrorResponse} from '@angular/common/http';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router} from '@angular/router';
import {DataType, ImportService, Transition} from '@netgrif/petriflow';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {AppBuilderConfigurationService} from '../../app-builder-configuration.service';
import {ChangedTransition} from '../../dialogs/dialog-transition-edit/changed-transition';
import {RoleRefType} from '../../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {DialogManageRolesComponent} from '../../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {
    DialogTransitionEditComponent,
    TransitionEditData,
} from '../../dialogs/dialog-transition-edit/dialog-transition-edit.component';
import {ActionsMasterDetailService} from '../actions-mode/actions-master-detail.setvice';
import {ActionsModeService} from '../actions-mode/actions-mode.service';
import {MenuItem} from '../edit-mode/context-menu/menu-items/menu-item';
import {ModelService} from '../services/model/model.service';
import {SelectedTransitionService} from '../selected-transition.service';
import {assignSystemPerformer, transitionIdToActivityKey} from './bpmn-conversion.util';
import {BpmnStateService} from './bpmn-state.service';
import {EnrichmentService} from './enrichment.service';

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    bpmnElementId: string;
}

const TASK_TYPES = new Set([
    'bpmn:Task', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ManualTask',
    'bpmn:ScriptTask', 'bpmn:SendTask', 'bpmn:ReceiveTask',
    'bpmn:BusinessRuleTask', 'bpmn:CallActivity', 'bpmn:SubProcess',
]);

// bpmn2pn maps every BPMN element X to a transition with id "<X>_t"
const TRANSITION_SUFFIX = '_t';

const SYNC_DEBOUNCE_MS = 600;

@Component({
    selector: 'nab-bpmn-mode',
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatTooltipModule,
    ],
    templateUrl: './bpmn-mode.component.html',
    styleUrl: './bpmn-mode.component.scss'
})
export class BpmnModeComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('bpmnCanvas') private _canvasRef!: ElementRef<HTMLDivElement>;
    @ViewChild('canvasWrapper') private _wrapperRef!: ElementRef<HTMLDivElement>;

    private _modeler: any;
    private readonly _bpmn2pnUrl: string;
    private _syncTimer: ReturnType<typeof setTimeout> | null = null;

    converting = false;
    ctxMenu: ContextMenuState = {visible: false, x: 0, y: 0, bpmnElementId: ''};
    menuItems: MenuItem[] = [];

    constructor(
        private _ngZone: NgZone,
        private _router: Router,
        private _http: HttpClient,
        private _dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private _modelService: ModelService,
        private _petriflowImport: ImportService,
        private _transitionService: SelectedTransitionService,
        private _actionMode: ActionsModeService,
        private _actionsMD: ActionsMasterDetailService,
        private _bpmnState: BpmnStateService,
        private _enrichment: EnrichmentService,
        config: AppBuilderConfigurationService,
    ) {
        this._bpmn2pnUrl = config.get().services?.urls?.bpmn2pn;
    }

    ngOnInit(): void {
        // Guard: a model built in Petriflow cannot be opened in the BPMN editor.
        const model = this._modelService.model;
        const hasContent = model &&
            (model.getPlaces().length > 0 || model.getTransitions().length > 0);
        if (hasContent && this._modelService.modelOrigin !== 'bpmn' && !this._bpmnState.isBpmnProject) {
            this._snackBar.open(
                'This model was built in Petriflow — the BPMN editor is not available.',
                'OK', {duration: 4000}
            );
            this._router.navigate(['/modeler']);
            return;
        }
        this._modelService.modelOrigin = 'bpmn';
        this._bpmnState.isBpmnProject = true;

        // Returning from /form or /actions (or after dialog edits): capture the
        // current task config into the enrichment store BEFORE the diagram is
        // re-converted, so the just-made edits are not overwritten by materialize.
        if (hasContent) {
            this._enrichment.harvestAll(model);
            this._enrichment.pendingHarvestTransitionId = null;
        }
    }

    ngAfterViewInit(): void {
        this._ngZone.runOutsideAngular(() => {
            this._modeler = new BpmnModeler({
                container: this._canvasRef.nativeElement,
            });

            // Restore the previously-drawn diagram, or start a fresh one.
            const saved = this._bpmnState.xml;
            const init = saved
                ? this._modeler.importXML(saved)
                : this._modeler.createDiagram();
            // After the diagram is in, write back any task-label changes the AI
            // assistant made (the BPMN name is the source of truth for labels).
            init
                .then(() => this._applyPendingLabels())
                .catch(() => this._modeler.createDiagram().catch(() => {}));

            // Keep the underlying Petriflow model in sync on structural changes,
            // and cache the diagram XML so it survives navigation.
            const onChange = () => this._ngZone.run(() => {
                this._cacheDiagram();
                this._scheduleSync();
            });
            this._modeler.on('shape.added', onChange);
            this._modeler.on('shape.remove', onChange);
            this._modeler.on('connection.added', onChange);
            this._modeler.on('connection.remove', onChange);
            this._modeler.on('element.changed', onChange);
            this._modeler.on('import.done', onChange);

            // Right-click → Petriflow context menu
            this._modeler.on('element.contextmenu', (event: any) => {
                event.originalEvent?.preventDefault();
                event.originalEvent?.stopPropagation();
                const el = event.element;
                if (TASK_TYPES.has(el.type)) {
                    this._ngZone.run(() => this._openCtxMenu(el, event.originalEvent));
                }
            });

            this._modeler.on('element.click', () => this._ngZone.run(() => this.hideCtxMenu()));
        });
    }

    ngOnDestroy(): void {
        if (this._syncTimer) clearTimeout(this._syncTimer);
        this._modeler?.destroy();
    }

    // ─── Background "podklad" sync ──────────────────────────────────────────────

    /** Cache the current diagram XML (local serialization, no network). */
    private _cacheDiagram(): void {
        this._modeler.saveXML({format: false})
            .then((r: {xml: string}) => { this._bpmnState.xml = r.xml; })
            .catch(() => {});
    }

    private _scheduleSync(): void {
        if (this._syncTimer) clearTimeout(this._syncTimer);
        this._syncTimer = setTimeout(() => this._convert(), SYNC_DEBOUNCE_MS);
    }

    /**
     * Converts the current BPMN diagram to Petriflow and updates the underlying
     * model. Returns true on success. Runs in the background after edits and
     * on demand when a context-menu action needs an up-to-date model.
     */
    private _convert(): Promise<boolean> {
        if (!this._bpmn2pnUrl) {
            return Promise.resolve(false);
        }
        if (this._syncTimer) { clearTimeout(this._syncTimer); this._syncTimer = null; }

        return new Promise<boolean>((resolve) => {
            this._ngZone.runOutsideAngular(async () => {
                let bpmnXml: string;
                try {
                    const r = await this._modeler.saveXML({format: false});
                    bpmnXml = r.xml;
                } catch {
                    this._ngZone.run(() => resolve(false));
                    return;
                }

                this._http.post(this._bpmn2pnUrl, bpmnXml, {
                    headers: {'Content-Type': 'text/xml;charset=US-ASCII'},
                    responseType: 'text',
                }).subscribe({
                    next: (pf: string) => { this._applyModel(pf); resolve(true); },
                    error: (e: HttpErrorResponse) => {
                        console.warn('[BpmnMode] conversion failed', e.status);
                        resolve(false);
                    }
                });
            });
        });
    }

    private _applyModel(petriflowXml: string): void {
        const result = this._petriflowImport.parseFromXml(petriflowXml);
        if (!result.model) return;

        // Overlay the enrichment store onto the freshly-converted structure.
        // (Replaces the old merge that scraped props off the previous conversion.)
        this._enrichment.materializeInto(result.model);

        // Collect task ids (for system-performer) and all element ids (for GC).
        const taskIds = new Set<string>();
        const allKeys = new Set<string>();
        try {
            const reg = this._modeler.get('elementRegistry');
            reg.forEach((el: any) => {
                allKeys.add(el.id);
                if (TASK_TYPES.has(el.type)) taskIds.add(el.id);
            });
        } catch { /* modeler not ready */ }

        // Wire the system role as performer only on synthetic transitions
        // (events/gateways like "finalize"), never on real BPMN tasks.
        assignSystemPerformer(result.model, taskIds);

        // Drop enrichment for activities no longer in the diagram (→ quarantine).
        this._enrichment.gc(allKeys);

        this._modelService.model = result.model;
    }

    // ─── Context menu ──────────────────────────────────────────────────────────

    private _openCtxMenu(element: any, mouse: MouseEvent | undefined): void {
        const rect = this._wrapperRef?.nativeElement.getBoundingClientRect();
        const x = Math.min((mouse?.clientX ?? 200) - (rect?.left ?? 0), (rect?.width ?? 500) - 235);
        const y = Math.min((mouse?.clientY ?? 200) - (rect?.top ?? 0), (rect?.height ?? 400) - 260);
        this.ctxMenu = {visible: true, x, y, bpmnElementId: element.id};

        // Same items & order as the Petriflow edit-mode transition context menu
        this.menuItems = [
            new MenuItem('Edit Task',     'edit',      () => this.editTask()),
            new MenuItem('Edit form',     'dashboard', () => this.editForm()),
            new MenuItem('Permissions',   'people',    () => this.editPermissions()),
            new MenuItem('Edit Actions',  'code',      () => this.editActions()),
            new MenuItem('Delete',        'delete',    () => this.deleteElement()),
        ];
    }

    itemClick(item: MenuItem): void {
        item.onClick();
    }

    hideCtxMenu(): void { this.ctxMenu.visible = false; }

    deleteElement(): void {
        const id = this.ctxMenu.bpmnElementId;
        this.hideCtxMenu();
        this._ngZone.runOutsideAngular(() => {
            try {
                const reg = this._modeler.get('elementRegistry');
                const modeling = this._modeler.get('modeling');
                const el = reg.get(id);
                if (el) modeling.removeElements([el]);
            } catch { /* ignore */ }
        });
    }

    /**
     * Resolve the Petriflow transition for the right-clicked BPMN element.
     * Uses the deterministic "<bpmnId>_t" id. If the underlying model isn't
     * up to date yet, converts on demand first.
     */
    private async _resolveTransition(): Promise<Transition | null> {
        const transitionId = this.ctxMenu.bpmnElementId + TRANSITION_SUFFIX;
        this.hideCtxMenu();

        let t = this._modelService.model?.getTransition(transitionId);
        if (t) return t;

        // Not synced yet — convert now (with overlay)
        this.converting = true;
        const ok = await this._convert();
        this.converting = false;
        if (!ok) return null;

        t = this._modelService.model?.getTransition(transitionId);
        if (!t) {
            this._snackBar.open('Could not link this task to Petriflow.', 'OK', {duration: 3000});
            return null;
        }
        return t;
    }

    async editTask(): Promise<void> {
        const t = await this._resolveTransition(); if (!t) return;
        const key = transitionIdToActivityKey(t.id);
        this._dialog.open(DialogTransitionEditComponent, {
            width: '50%', panelClass: 'dialog-width-50',
            data: {transitionId: t.id} as TransitionEditData,
        }).afterClosed().subscribe((changed: ChangedTransition | undefined) => {
            if (changed) {
                this._modelService.updateTransition(changed);
                // Petriflow → BPMN: a Label change is written back to the BPMN
                // element so the diagram stays in sync (and the next convert keeps it).
                const newLabel = changed.transition?.label?.value;
                if (newLabel !== undefined) this._renameBpmnElement(key, newLabel);
            }
            const updated = this._modelService.model?.getTransition(t.id)
                ?? this._modelService.model?.getTransition(changed?.transition?.id ?? '');
            if (updated) this._enrichment.harvest(updated, this._modelService.model, key);
        });
    }

    /** Push a Petriflow label change back onto the corresponding BPMN element. */
    private _renameBpmnElement(bpmnId: string, label: string): void {
        this._ngZone.runOutsideAngular(() => {
            try {
                const reg = this._modeler.get('elementRegistry');
                const modeling = this._modeler.get('modeling');
                const el = reg.get(bpmnId);
                if (el && (el.businessObject?.name ?? '') !== label) {
                    modeling.updateLabel(el, label);
                }
            } catch { /* ignore */ }
        });
    }

    /**
     * Apply task-label changes the AI assistant made onto the BPMN diagram.
     * Labels live on the BPMN element (not the enrichment store), so updating
     * them here makes them show on the canvas and survive the next conversion;
     * the resulting element.changed events trigger the usual cache + sync.
     * Swallows its own errors so a failure never aborts diagram restoration.
     */
    private _applyPendingLabels(): void {
        const overrides = this._bpmnState.pendingLabelOverrides;
        if (!overrides || overrides.size === 0) return;
        this._bpmnState.pendingLabelOverrides = null;
        try {
            const reg = this._modeler.get('elementRegistry');
            const modeling = this._modeler.get('modeling');
            overrides.forEach((label, elementId) => {
                const el = reg.get(elementId);
                if (el && label != null && (el.businessObject?.name ?? '') !== label) {
                    modeling.updateLabel(el, label);
                }
            });
        } catch { /* ignore */ }
    }

    async editForm(): Promise<void> {
        const t = await this._resolveTransition(); if (!t) return;
        // Navigates away → harvested on BPMN re-entry (ngOnInit harvestAll).
        this._enrichment.pendingHarvestTransitionId = t.id;
        this._transitionService.id = t.id;
        this._transitionService.returnUrl = '/modeler/bpmn';
        this._router.navigate(['/form']);
    }

    async editPermissions(): Promise<void> {
        const t = await this._resolveTransition(); if (!t) return;
        const key = transitionIdToActivityKey(t.id);
        const model = this._modelService.model;
        this._dialog.open(DialogManageRolesComponent, {
            width: '60%', panelClass: 'dialog-width-60',
            data: {
                type: RoleRefType.TRANSITION,
                roles: model.getRoles(),
                rolesRefs: t.roleRefs,
                userRefs: t.userRefs,
                userLists: model.getDataSet().filter(d => d.type === DataType.USER_LIST),
            },
        }).afterClosed().subscribe(() => {
            const updated = this._modelService.model?.getTransition(t.id);
            if (updated) this._enrichment.harvest(updated, this._modelService.model, key);
        });
    }

    async editActions(): Promise<void> {
        const t = await this._resolveTransition(); if (!t) return;
        // Navigates away → harvested on BPMN re-entry (ngOnInit harvestAll).
        this._enrichment.pendingHarvestTransitionId = t.id;
        this._actionMode.activate(this._actionMode.transitionActionsTool);
        this._actionsMD.select(t);
        this._transitionService.id = t.id;
        this._router.navigate(['modeler/actions']);
    }
}
