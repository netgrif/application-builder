import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild} from '@angular/core';
import {PetriflowCanvasConfiguration} from '@netgrif/petriflow.svg';
import {MatDialog} from '@angular/material/dialog';
import {NgxDropzoneChangeEvent} from 'ngx-dropzone';
import {ModelImportService} from '../model-import-service';
import {EditModeService} from './edit-mode.service';
import {ModelService} from '../services/model/model.service';
import {ContextMenuComponent} from './context-menu/context-menu.component';
import {ContextMenu} from './context-menu/context-menu';
import {HistoryService} from '../services/history/history.service';

@Component({
    selector: 'nab-edit-mode',
    templateUrl: './edit-mode.component.html',
    styleUrls: ['./edit-mode.component.scss']
})
export class EditModeComponent implements AfterViewInit, OnDestroy {

    @ViewChild('contextMenu', {read: ElementRef}) contextMenu: ElementRef;
    @ViewChild('contextMenu') contextMenuComponent: ContextMenuComponent;

    constructor(
        private importService: ModelImportService,
        private _modelService: ModelService,
        private _editModeService: EditModeService,
        private historyService: HistoryService,
        public dialog: MatDialog
    ) {
    }

    ngAfterViewInit() {
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
        this.editModeService.activeTool.unbind();
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
