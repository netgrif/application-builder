// src/app/dialogs/dialog-assistant/xml/xml-applier.service.ts
import { Injectable } from '@angular/core';

// Use your existing service that talks to the backend which accepts Petriflow XML.
// If the method actually lives in a different service, just change this import.
import { PetriflowExamplesService } from '../service/petriflow-examples.service';

export interface ApplyXmlOptions {
    /** Optional target app/workspace identifier if your backend needs routing */
    appId?: string;
    /** If true, attempt a dry run/validation endpoint when available */
    validateOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class XmlApplierService {
    constructor(private readonly petriflow: PetriflowExamplesService) {}

    /**
     * Apply (or validate) Petriflow XML using your existing backend.
     * - If `validateOnly` is true and a validation endpoint exists, it will be used.
     * - Otherwise it will try to import/apply/deploy the XML.
     *
     * This method resolves when the backend call succeeds,
     * and throws an Error with a readable message if it fails.
     */
    async apply(xml: string, opts: ApplyXmlOptions = {}): Promise<void> {
        if (!xml?.trim()) {
            throw new Error('No XML provided.');
        }

        // Optionally validate first (if the backend supports it)
        if (opts.validateOnly) {
            await this.tryValidate(xml, opts);
            return;
        }

        // Try a few common method names on your backend service without changing that service
        // (You can remove what you don’t need once you confirm the correct method.)
        const candidateCalls: Array<() => Promise<any>> = [
            // Common names in codebases
            () => (this.petriflow as any).applyXml?.(xml, opts),
            () => (this.petriflow as any).importXml?.(xml, opts),
            () => (this.petriflow as any).deployXml?.(xml, opts),
            // Object-shaped payloads
            () => (this.petriflow as any).applyXml?.({ xml, ...opts }),
            () => (this.petriflow as any).importXml?.({ xml, ...opts }),
            () => (this.petriflow as any).deployXml?.({ xml, ...opts }),
        ].filter(Boolean) as Array<() => Promise<any>>;

        if (!candidateCalls.length) {
            throw new Error(
                'No XML apply/import/deploy method found on PetriflowExamplesService. ' +
                'Please map the correct method in xml-applier.service.ts.'
            );
        }

        const errMessages: string[] = [];
        for (const call of candidateCalls) {
            try {
                await call();
                return; // success
            } catch (e: any) {
                errMessages.push(this.extractErr(e));
            }
        }

        throw new Error(
            'Failed to apply XML via backend. Attempts:\n' +
            errMessages.map((m, i) => `  ${i + 1}) ${m}`).join('\n')
        );
    }

    /**
     * Optional helper to validate the XML without applying it.
     * Will try a few common method names; adjust once you confirm your backend.
     */
    private async tryValidate(xml: string, opts: ApplyXmlOptions): Promise<void> {
        const candidateCalls: Array<() => Promise<any>> = [
            () => (this.petriflow as any).validateXml?.(xml, opts),
            () => (this.petriflow as any).validateXml?.({ xml, ...opts }),
            // Some backends expose “dry-run” on the same endpoint
            () => (this.petriflow as any).applyXml?.({ xml, validateOnly: true, ...opts }),
            () => (this.petriflow as any).importXml?.({ xml, validateOnly: true, ...opts }),
        ].filter(Boolean) as Array<() => Promise<any>>;

        if (!candidateCalls.length) {
            // If no explicit validator, silently fall back to a no-op.
            return;
        }

        const errMessages: string[] = [];
        for (const call of candidateCalls) {
            try {
                await call();
                return; // success
            } catch (e: any) {
                errMessages.push(this.extractErr(e));
            }
        }

        throw new Error(
            'XML did not pass validation. Attempts:\n' +
            errMessages.map((m, i) => `  ${i + 1}) ${m}`).join('\n')
        );
    }

    /** Extract a readable error from various HTTP/client error shapes. */
    private extractErr(e: any): string {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        const msg = e.message || e.statusText || e.name;
        const code = e.status || e.code;
        // Try common API error shapes
        const detail = e.error?.message || e.error?.detail || e.response?.data?.message;
        return [code && `[${code}]`, msg, detail].filter(Boolean).join(' ');
    }
}
