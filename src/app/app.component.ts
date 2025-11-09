import { AfterViewInit, Component, HostListener, Injector, ApplicationRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router';
import { filter, first, firstValueFrom, ReplaySubject } from 'rxjs';
import { NetgrifApplicationEngine } from '@netgrif/components-core/';
import { AppBuilderConfigurationService } from './app-builder-configuration.service';
import { DialogConfirmComponent } from './dialogs/dialog-confirm/dialog-confirm.component';
import { DialogLocalStorageModelComponent } from './dialogs/dialog-local-storage-model/dialog-local-storage-model.component';
import { ModelerConfig } from './modeler/modeler-config';
import { MortgageService } from './modeler/mortgage.service';
import { TutorialService } from './tutorial/tutorial-service';
import { JoyrideService } from 'ngx-joyride';

// !!! NEINJEKTOVAŤ tieto služby do ctoru, získavame ich neskôr
import { ModelImportService } from './modeler/model-import-service';
import { ModelExportService } from './modeler/services/model/model-export.service';
import { ModelService } from './modeler/services/model/model.service';

function resolveParentOrigin(): string {
    const w = window as any;
    if (typeof w.__PARENT_ORIGIN__ === 'string' && w.__PARENT_ORIGIN__) return w.__PARENT_ORIGIN__;
    try {
        if (document.referrer) {
            const u = new URL(document.referrer);
            return u.origin;
        }
    } catch { /* ignore */ }
    return window.location.origin; // single-open fallback
}

@Component({
    selector: 'nab-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    title = 'Netgrif Application Builder';
    config: NetgrifApplicationEngine;

    private readonly isEmbedded = window.self !== window.top;
    private readonly PARENT_ORIGIN = resolveParentOrigin();
    private messageHandlerBound = false;

    // Keď je editor skutočne pripravený (navigovaný, iniciovaný, stabilný)
    private editorReady$ = new ReplaySubject<boolean>(1);

    @HostListener('window:beforeunload', ['$event'])
    WindowBeforeUnload($event: any) {
        $event.returnValue = 'Your data will be lost!';
    }

    constructor(
        config: AppBuilderConfigurationService,
        private router: Router,
        private matDialog: MatDialog,
        private readonly joyrideService: JoyrideService,
        private _mortgageService: MortgageService,
        private tutorialService: TutorialService,
        private appRef: ApplicationRef,
        private injector: Injector,
    ) {
        this.config = config.get();

        // Po štarte 4201 vymaž pamäť asistenta (dočasné správanie)
        this.wipeAssistantState();
    }

    /** Vymaže uložený kontext asistenta (jednoduchý prefix-match v localStorage). */
    private wipeAssistantState(): void {
        try {
            const toRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i) || '';
                if (k.startsWith('nab.dialog.assistant.v3')) toRemove.push(k);
            }
            toRemove.forEach(k => localStorage.removeItem(k));
        } catch { /* ignore */ }
    }

    private clearDraftStorage() {
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP);
        localStorage.removeItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE);
    }

    private send(type: string, payload?: any) {
        try {
            if (window.parent === window) return; // nie sme v ifrime
            window.parent?.postMessage({ type, payload }, this.PARENT_ORIGIN);
        } catch {
            window.parent?.postMessage({ type, payload }, '*');
        }
    }

    private async createEmptyModel(): Promise<void> {
        try {
            const modelSvc = await this.waitForService<ModelService>(ModelService);
            if (typeof (modelSvc as any).createNewModel === 'function') { (modelSvc as any).createNewModel({ title: 'New process' }); return; }
            if (typeof (modelSvc as any).newModel === 'function') { (modelSvc as any).newModel({ title: 'New process' }); return; }
            if (typeof (modelSvc as any).reset === 'function') { (modelSvc as any).reset(); return; }
        } catch { /* fallback */ }

        const importSvc = await this.waitForService<ModelImportService>(ModelImportService);
        const EMPTY_XML = `<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://petriflow.com/petriflow.schema.xsd">
                            <id>new_model</id>
                            <version>1.0.0</version>
                            <initials>NEW</initials>
                            <title>New Model</title>
                            <icon>device_hub</icon>
                            <defaultRole>true</defaultRole>
                            <anonymousRole>true</anonymousRole>
                            <transitionRole>false</transitionRole>
                           </document>`;
        importSvc.importFromXml(EMPTY_XML);
    }

    private async waitForService<T>(type: new (...args: any[]) => T, tries = 20, delay = 150): Promise<T> {
        for (let i = 0; i < tries; i++) {
            try { return this.injector.get<T>(type); }
            catch { await new Promise(r => setTimeout(r, delay)); }
        }
        throw new Error(`Service ${type.name} not ready after ${tries} tries`);
    }

    async ngAfterViewInit(): Promise<void> {
        const oldModel = localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.KEY);
        if (oldModel && !this.isEmbedded) {
            const dialogRef = this.matDialog.open(DialogLocalStorageModelComponent, {
                data: {
                    id: localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.ID),
                    timestamp: localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TIMESTAMP),
                    title: localStorage.getItem(ModelerConfig.LOCALSTORAGE.DRAFT_MODEL.TITLE),
                },
            });

            dialogRef.afterClosed().subscribe(async result => {
                if (result === true) {
                    await this.ensureModelerReady();
                    const importSvc = await this.waitForService<ModelImportService>(ModelImportService);
                    importSvc.importFromXml(oldModel);
                } else if (result === false) {
                    localStorage.clear();
                }
            });
        } else if (this.isEmbedded) {
            this.clearDraftStorage();
        }

        /** IMPORT */
        let importBusy = false;
        const applyXml = async (xml: string) => {
            try {
                if (importBusy) return;
                importBusy = true;

                if (this.isEmbedded) this.clearDraftStorage();
                await this.ensureModelerReady();

                const importSvc = await this.waitForService<ModelImportService>(ModelImportService);
                importSvc.importFromXml(xml);

                await firstValueFrom(this.appRef.isStable.pipe(filter(v => v), first()));
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

                this.send('IMPORT_RESULT', { ok: true });
                this.send('MODEL_READY');
            } catch (e: any) {
                this.send('IMPORT_RESULT', { ok: false, error: e?.message || String(e) });
            } finally {
                importBusy = false;
            }
        };

        /** EXPORT */
        let exportBusy = false;
        const exportXml = async (): Promise<string> => {
            await firstValueFrom(this.editorReady$);

            const exportSvc = await this.waitForService<ModelExportService>(ModelExportService);
            let xml = '';
            for (let i = 0; i < 10; i++) {
                try {
                    xml = exportSvc.exportXml();
                    if (xml && xml.length > 0) break;
                } catch {}
                await new Promise(r => setTimeout(r, 120));
            }
            if (!xml) throw new Error('Export failed or empty XML');
            return xml;
        };

        /** MESSAGE BRIDGE */
        if (!this.messageHandlerBound) {
            window.addEventListener('message', async (event: MessageEvent) => {
                // ak sme single-open (parent===self), nepodmieňuj origin
                if (window.parent !== window && event.origin !== this.PARENT_ORIGIN) return;

                const { type, payload } = (event.data || {}) as { type?: string; payload?: any };

                if (type === 'LOAD_XML' && typeof payload === 'string') {
                    await applyXml(payload);
                    return;
                }

                if (type === 'CREATE_EMPTY') {
                    try {
                        if (this.isEmbedded) this.clearDraftStorage();
                        await this.ensureModelerReady();
                        await this.createEmptyModel();
                        await firstValueFrom(this.appRef.isStable.pipe(filter(v => v), first()));
                        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                        this.send('MODEL_READY');
                    } catch (e: any) {
                        this.send('IMPORT_RESULT', { ok: false, error: e?.message || String(e) });
                    }
                    return;
                }

                if (type === 'REQUEST_EXPORT_XML') {
                    if (exportBusy) return;
                    exportBusy = true;
                    this.send('EXPORT_PENDING');
                    try {
                        const xml = await exportXml();
                        this.send('EXPORT_XML', { xml });
                    } catch (e: any) {
                        this.send('EXPORT_ERROR', { error: e?.message || String(e) });
                    } finally {
                        exportBusy = false;
                    }
                    return;
                }
            });
            this.messageHandlerBound = true;
        }

        this.send('IFRAME_READY');
    }

    /** Zabezpečí /modeler + inicializáciu editoru a lazy služieb. */
    private async ensureModelerReady(): Promise<void> {
        const goModeler = async () => {
            await this.router.navigate(['/modeler'], { replaceUrl: true });
            await firstValueFrom(this.router.events.pipe(filter(e => e instanceof NavigationEnd), first()));
        };

        if (this.router.url.includes('/form')) {
            await goModeler();
            await new Promise(r => setTimeout(r, 250));
            if (!this.router.url.includes('/modeler')) {
                window.location.replace('/modeler');
                return;
            }
        }

        if (!this.router.url.includes('/modeler')) {
            await goModeler();
        }

        await this.waitForService<ModelImportService>(ModelImportService);
        await this.waitForService<ModelExportService>(ModelExportService);

        await firstValueFrom(this.appRef.isStable.pipe(filter(v => v), first()));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
            const modelSvc = this.injector.get<ModelService>(ModelService);
            if (!modelSvc || !(modelSvc as any).model) {
                const start = performance.now();
                while (performance.now() - start < 2000) {
                    if ((modelSvc as any).model || (modelSvc as any).currentModel) break;
                    await new Promise(r => setTimeout(r, 50));
                }
            }
        } catch {}

        this.editorReady$.next(true);
    }

    // UI helpery
    addMortgage() {
        const dialogRef = this.matDialog.open(DialogConfirmComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this._mortgageService.loadModel();
                this.router.navigate(['/modeler']);
            }
        });
    }

    help() {
        this.joyrideService.startTour({
            steps: this.tutorialService.steps,
            themeColor: '#0f4c81dd',
        });
    }

    get tutorial() {
        return this.tutorialService;
    }

    openInTab(url: string) {
        window.open(url, '_blank');
    }
}
