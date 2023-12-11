import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatTabGroup} from '@angular/material/tabs';
import {Router} from '@angular/router';
import {DataGroup, PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {NgxDropzoneChangeEvent} from 'ngx-dropzone';
import {DialogManageRolesComponent, RoleRefType} from '../../dialogs/dialog-manage-roles/dialog-manage-roles.component';
import {
  DialogTransitionSettingsComponent,
} from '../../dialogs/dialog-transition-settings/dialog-transition-settings.component';
import {Canvas} from '../classes/canvas';
import {PetriNet} from '../classes/petri-net';
import {ModelerConfig} from '../modeler-config';
import {SelectedTransitionService} from '../selected-transition.service';
import {CanvasService} from '../services/canvas.service';
import {ModelExportService} from '../services/model-export.service';
import {ModelService} from '../services/model.service';
import {FastModeContextComponent} from './fast-mode-context/fast-mode-context.component';
import {FastPnMode} from './fast-pn-mode.enum';
import {FastPnService} from './fast-pn.service';

@Component({
  selector: 'nab-edit-mode',
  templateUrl: './edit-mode.component.html',
  styleUrls: ['./edit-mode.component.scss'],
})
export class EditModeComponent implements AfterViewInit {

  @ViewChild('canvas') canvas: ElementRef;
  @ViewChild('ctxMenu') contextMenu: ElementRef;
  @ViewChild('modelCtxMenu') modelCtxMenu: ElementRef;
  @ViewChild('fastPnContextMenu') fastPnContextMenu: FastModeContextComponent;
  @Input() tabGroup: MatTabGroup;

  constructor(
    private modelService: ModelService,
    private canvasService: CanvasService,
    private router: Router,
    public dialog: MatDialog,
    private _hotkeysService: HotkeysService,
    private exportService: ModelExportService,
    private _fastPnService: FastPnService,
    private transitionService: SelectedTransitionService,
  ) {
    this._hotkeysService.add(new Hotkey('ctrl+s', (event: KeyboardEvent): boolean => {
      this.exportService.exportXML();
      return false;
    }));
    this._hotkeysService.add(new Hotkey('del', (event: KeyboardEvent): boolean => {
      this.modelService.whichButton.next('delete');
      this.canvasService.reset();
      return false;
    }));
  }

  ngAfterViewInit() {
    this.canvasService.canvas = new Canvas(this.canvas.nativeElement);
    this.canvasService.canvas.resize(this.modelService.appwidth, this.modelService.appheight);

    // LEGACY PART
    ModelerConfig.VERTICAL_OFFSET = this.canvas.nativeElement.offsetTop;
    ModelerConfig.HORIZONTAL_OFFSET = this.canvas.nativeElement.offsetLeft;

    setTimeout(() => {
      if (this.modelService.model === undefined) {
        this.modelService.model = new PetriflowPetriNet();
        this.modelService.graphicModel = new PetriNet(this.modelService.model);
      }
      this.canvasService.renderModel(this.modelService.model);
      this.reset('select');
    });
  }

  doMouseDown($event: MouseEvent) {
    this.canvasService.doMouseDown($event);
  }

  doMouseMove($event: MouseEvent) {
    this.canvasService.doMouseMove($event);
  }

  openFormBuilder() {
    this.closeContextMenu();
    this.router.navigate(['/form']);
    const id = this.transitionService.id;
    const transition = this.modelService.model.getTransition(id);
    if (transition.dataGroups.length === 0) {
      const dataGroup = new DataGroup(`${transition.id}_0`);
      dataGroup.layout = ModelerConfig.LAYOUT_DEFAULT_TYPE;
      dataGroup.cols = ModelerConfig.LAYOUT_DEFAULT_COLS;
      transition.dataGroups.push(dataGroup);
    }
    this.modelService.transition = this.modelService.graphicModel.transitions.find((item) => item.transition.id === id);
  }

  isEdit(): boolean {
    const id = this.transitionService.id;
    if (id === null) {
      return false;
    } else {
      try {
        const t = this.modelService.model.getTransition(id);
        return t.dataGroups.length > 0 && t.dataGroups.filter(g => g.getDataRefs().length > 0).length > 0;
      } catch (e) {
        return false;
      }
    }
  }

  manageRoles() {
    this.closeContextMenu();
    const id = this.transitionService.id;
    if (id === null) {
      return false;
    } else {
      this.dialog.open(DialogManageRolesComponent, {
        width: '60%',
        data: {
          type: RoleRefType.TRANSITION,
          roles: this.modelService.model.getRoles(),
          rolesRefs: this.modelService.model.getTransition(id).roleRefs,
          userRefs: this.modelService.model.getTransition(id).userRefs,
          userLists: this.modelService.model.getDataSet().filter(item => item.type === 'userList'),
        },
      });
    }
  }

  manageActions(): boolean {
    this.closeContextMenu();
    const id = this.transitionService.id;
    if (!id) {
      console.warn('No transition was selected! Aborting navigation to /modeler/actions');
      return false;
    } else {
      this.router.navigateByUrl('modeler/actions').then(r => null);
      return true;
    }
  }

  reset(field: string) {
    this.modelService.whichButton.next(field);
    this.canvasService.reset();
  }

  openTaskConfigDialog() {
    this.closeContextMenu();
    const id = this.transitionService.id;
    if (id === null) {
      return false;
    } else {
      this.dialog.open(DialogTransitionSettingsComponent, {
        width: '60%',
      }).afterClosed().subscribe(ignored => {
        this.canvasService.renderModel(this.modelService.model);
      });
    }
  }

  openSideNav() {
    this.closeContextMenu();
    this.canvasService.openSideNav.next(true);
  }

  manageProcessPermissions() {
    this.closeContextMenu();
    this.dialog.open(DialogManageRolesComponent, {
      width: '60%',
      data: {
        type: RoleRefType.PROCESS,
        roles: this.modelService.model.getRoles(),
        processRolesRefs: this.modelService.model.getRoleRefs(),
        processUserRefs: this.modelService.model.getUserRefs(),
        userLists: this.modelService.model.getDataSet().filter(item => item.type === 'userList'),
      },
    });
  }

  contextModelMenu(event) {
    if (this.modelCtxMenu && this.modelCtxMenu.nativeElement !== null) {
      const contextMenu = this.modelCtxMenu.nativeElement;
      const style = contextMenu.style;
      const area = document.getElementById('modeler_area');
      const areaBounds = area.getBoundingClientRect();
      style.top = (((event.clientY + contextMenu.offsetHeight - areaBounds.y) > area.offsetHeight) ? (areaBounds.y + area.offsetHeight - contextMenu.offsetHeight) : (event.clientY)) + 'px';
      style.left = (((event.clientX + contextMenu.offsetWidth - areaBounds.x) > area.offsetWidth) ? (areaBounds.x + area.offsetWidth - contextMenu.offsetWidth) : (event.clientX)) + 'px';
      style.visibility = 'visible';
      style.opacity = '1';
      if (this.canvasService.isActiveFastPn.getValue() && this.canvasService.isCustomFastPn.getValue() && !this.canvasService.startAgain.getValue()
        || this._fastPnService.actualMode === FastPnMode.ARC && this.modelService.pocetmousedownright !== 2) {
        const fastContext = this.fastPnContextMenu;
        fastContext.showComponent(event);
        this.contextMenu.nativeElement.style.visibility = 'hidden';
        style.visibility = 'hidden';
        style.opacity = '0';
      }
      if (this.modelService.pocetmousedownright === 2) {
        style.visibility = 'hidden';
        style.opacity = '0';
        this.modelService.pocetmousedownright = 0;
      }
      if (this.contextMenu && this.contextMenu.nativeElement !== null) {
        this.contextMenu.nativeElement.style.visibility = 'hidden';
      }
      if (this.canvasService.isCustomFastPn.getValue()) {
        style.visibility = 'hidden';
      }
      event.preventDefault();
    }
  }

  dragOverHandler(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  dropHandler(event: any) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // TODO: drag&drop model import
    }
  }

  size(): number {
    return ModelerConfig.GRID_STEP;
  }

  gridStroke(): string {
    if (this.modelService.whichButton.value === 'move' ||
      this.modelService.whichButton.value === 'transition' ||
      this.modelService.whichButton.value === 'fastpn' ||
      this.modelService.whichButton.value === 'place'
    ) {
      return '#ccc';
    }
    return 'transparent';
  }

  onDropZone($event: NgxDropzoneChangeEvent) {
    $event.addedFiles[0].text().then(originFile => {
      this.modelService.dropZoneEvent.next(originFile);
    });
  }

  private closeContextMenu() {
    this.contextMenu.nativeElement.style.visibility = 'hidden';
    this.modelCtxMenu.nativeElement.style.visibility = 'hidden';
    this.fastPnContextMenu.hideComponent();
  }
}
