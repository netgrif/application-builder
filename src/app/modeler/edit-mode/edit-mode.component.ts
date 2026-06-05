import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {PetriNet} from '@netgrif/petriflow';
import {Subscription} from 'rxjs';
import {NgxDropzoneChangeEvent} from 'ngx-dropzone';
import {ModelImportService} from '../model-import-service';
import {ModelerUtils} from '../modeler-utils';
import {HistoryService} from '../services/history/history.service';
import {ModelService} from '../services/model/model.service';
import {BpmnStateService} from '../bpmn-mode/bpmn-state.service';
import {EnrichmentService} from '../bpmn-mode/enrichment.service';
import {ContextMenu} from './context-menu/context-menu';
import {ContextMenuComponent} from './context-menu/context-menu.component';
import {EditModeService} from './edit-mode.service';

@Component({
    selector: 'nab-edit-mode',
    templateUrl: './edit-mode.component.html',
    styleUrls: ['./edit-mode.component.scss']
})
export class EditModeComponent implements AfterViewInit, OnDestroy {

    @ViewChild('contextMenu', {read: ElementRef}) contextMenu: ElementRef;
    @ViewChild('contextMenu') contextMenuComponent: ContextMenuComponent;

    private _lastStructure = '';
    private _historySub?: Subscription;

    constructor(
        private importService: ModelImportService,
        private _modelService: ModelService,
        private _editModeService: EditModeService,
        private historyService: HistoryService,
        public dialog: MatDialog,
        private _bpmnState: BpmnStateService,
        private _enrichment: EnrichmentService
    ) {
    }

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    ngAfterViewInit() {
        ModelerUtils.clearSelection();

        // Mode-lock: a model with Petriflow content that did NOT come from the
        // BPMN editor is a pure Petriflow model — block the BPMN editor.
        const model = this._modelService.model;
        const hasContent = model &&
            (model.getPlaces().length > 0 || model.getTransitions().length > 0);
        if (hasContent && this._modelService.modelOrigin !== 'bpmn' && !this._bpmnState.isBpmnProject) {
            this._modelService.modelOrigin = 'petriflow';
        }

        // For a BPMN-originated model the BPMN editor stays available UNTIL the
        // user changes the NET STRUCTURE (places / transitions / arcs) here.
        // Editing task config (form, roles, actions, task properties) does NOT
        // lock — those are preserved across BPMN re-conversion. We compare a
        // structural signature so config-only edits (which still go through
        // HistoryService) don't trigger the lock.
        this._lastStructure = this._structureSignature(this._modelService.model);
        this._historySub = this.historyService.historyChange.subscribe(() => {
            const sig = this._structureSignature(this._modelService.model);
            const structureChanged = sig !== this._lastStructure;
            this._lastStructure = sig;
            if (structureChanged && this._modelService.modelOrigin === 'bpmn') {
                this._modelService.modelOrigin = 'petriflow';
                this._bpmnState.clear();
                this._enrichment.clear();
            }
        });

        this._editModeService.contextMenuItems.subscribe(menu => {
            if (!menu) {
                this.contextMenu.nativeElement.style.visibility = 'hidden';
                return;
            }
            this.contextMenuComponent.menuItems = menu.items;
            this.contextMenu.nativeElement.style.visibility = 'visible';
            this.contextMenu.nativeElement.style.opacity = '1';
            this.checkPosition(menu);
            setTimeout(() => {
                this.checkPosition(menu);
            }, 100);
        });
        setTimeout(() => {
            if (this._modelService.model === undefined) {
                // Fresh start — drop any stale BPMN diagram/enrichment and unlock mode choice.
                this._bpmnState.clear();
                this._enrichment.clear();
                this._modelService.modelOrigin = 'none';
                this._modelService.model = this._modelService.newModel();
                this.historyService.save(`New model has been created.`);
            } else {
                this._editModeService.renderModel();
            }
        });
    }

    private checkPosition(menu: ContextMenu): void {
        const area = document.getElementById('modeler_area');
        const areaBounds = area.getBoundingClientRect();
        this.contextMenu.nativeElement.style.top = (((menu.position.y + this.contextMenu.nativeElement.firstChild.offsetHeight - areaBounds.y) > area.offsetHeight)
            ? (areaBounds.y + area.offsetHeight - this.contextMenu.nativeElement.firstChild.offsetHeight) : (menu.position.y)) + 'px';
        this.contextMenu.nativeElement.style.left = (((menu.position.x + this.contextMenu.nativeElement.firstChild.offsetWidth - areaBounds.x) > area.offsetWidth)
            ? (areaBounds.x + area.offsetWidth - this.contextMenu.nativeElement.firstChild.offsetWidth) : (menu.position.x)) + 'px';
    }

    ngOnDestroy(): void {
        this._historySub?.unsubscribe();
        this.editModeService.activeTool.unbind();
    }

    /**
     * Structural fingerprint of the net: place ids, transition ids and arc
     * endpoints. Changes when the user adds/removes/reconnects net elements,
     * but NOT when only task config (form, roles, actions) changes.
     */
    private _structureSignature(model: PetriNet | undefined): string {
        if (!model) return '';
        const places = model.getPlaces().map(p => p.id).sort();
        const transitions = model.getTransitions().map(t => t.id).sort();
        const arcs = model.getArcs()
            .map(a => `${a.source?.id}->${a.destination?.id}:${a.type}`)
            .sort();
        return JSON.stringify({places, transitions, arcs});
    }

    onDropZone($event: NgxDropzoneChangeEvent) {
        $event.addedFiles[0].text().then(originFile => {
            this.importService.importFromXml(originFile);
        });
    }

    get editModeService(): EditModeService {
        return this._editModeService;
    }
}
