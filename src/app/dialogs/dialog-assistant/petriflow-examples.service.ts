// src/app/dialogs/dialog-assistant/petriflow-examples.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PetriflowExamplesService {
    private cachedFewShot = '';
    private tried = false;

    /**
     * Loads ONLY mortgage.xml and request.xml (full, no truncation) from assets/petriflow/.
     * If any is missing, it simply returns what it has.
     */
    async getFewShot(): Promise<string> {
        if (this.cachedFewShot || this.tried) return this.cachedFewShot;
        this.tried = true;

        const wanted = ['mortgage.xml', 'request.xml']; // exact 2 examples
        const parts: string[] = [];

        for (const name of wanted) {
            try {
                const url = `assets/petriflow/${name}`;
                const res = await fetch(url);
                if (!res.ok) continue;
                const xml = await res.text();
                parts.push(`---EXAMPLE_${name.toUpperCase()}_START---\n${xml}\n---EXAMPLE_${name.toUpperCase()}_END---`);
            } catch { /* ignore single file failure */ }
        }

        this.cachedFewShot = parts.join('\n\n');
        return this.cachedFewShot;
    }
}
