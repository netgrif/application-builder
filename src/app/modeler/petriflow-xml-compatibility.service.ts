import {Injectable} from '@angular/core';
import {ImportService, PetriNet, PetriNetResult} from '@netgrif/petriflow';

@Injectable({providedIn: 'root'})
export class PetriflowXmlCompatibilityService {
    parseFromXml(importService: ImportService, xml: string): PetriNetResult {
        const result = importService.parseFromXml(xml);
        if (result.model) {
            this.applyRoleGlobals(xml, result.model);
        }
        return result;
    }

    normalizeExport(xml: string): string {
        const document = this.parse(xml);
        if (!document) {
            return xml;
        }
        this.roles(document).forEach(role => {
            const legacyGlobal = this.directChild(role, 'global');
            const attribute = role.getAttribute('global');
            const global = attribute === null
                ? this.booleanValue(legacyGlobal?.textContent)
                : this.booleanValue(attribute);
            this.directChildren(role, 'global').forEach(element => element.remove());
            if (global) {
                role.setAttribute('global', 'true');
            } else {
                role.removeAttribute('global');
            }
        });
        return new XMLSerializer().serializeToString(document);
    }

    applyRoleGlobals(xml: string, model: PetriNet): void {
        const document = this.parse(xml);
        if (!document) {
            return;
        }
        this.roles(document).forEach(roleElement => {
            const id = this.directChild(roleElement, 'id')?.textContent?.trim();
            const role = id ? model.getRole(id) : undefined;
            if (!role) {
                return;
            }
            const attribute = roleElement.getAttribute('global');
            const legacyGlobal = this.directChild(roleElement, 'global')?.textContent;
            role.global = attribute === null
                ? this.booleanValue(legacyGlobal)
                : this.booleanValue(attribute);
        });
    }

    private parse(xml: string): Document | undefined {
        const document = new DOMParser().parseFromString(xml, 'application/xml');
        return document.getElementsByTagName('parsererror').length === 0 ? document : undefined;
    }

    private roles(document: Document): Array<Element> {
        return Array.from(document.documentElement?.children ?? [])
            .filter(element => element.localName === 'role');
    }

    private directChild(element: Element, name: string): Element | undefined {
        return this.directChildren(element, name)[0];
    }

    private directChildren(element: Element, name: string): Array<Element> {
        return Array.from(element.children).filter(child => child.localName === name);
    }

    private booleanValue(value: string | null | undefined): boolean {
        const normalized = value?.trim().toLowerCase();
        return normalized === 'true' || normalized === '1';
    }
}
