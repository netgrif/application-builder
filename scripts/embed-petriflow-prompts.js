#!/usr/bin/env node
/**
 * Pre-build step: read the Petriflow system-prompt + reference markdown
 * from src/petriflow-context/ (NOT shipped in /assets) and inline them
 * as TypeScript string constants in src/app/modeler/services/ai-assistant/
 * generated-petriflow-prompts.ts.
 *
 * Rationale: the reference file is the AI's secret sauce — we don't want it
 * served from /assets/petriflow/*.md where it's discoverable by URL.
 *
 * Run automatically from npm scripts (start, build, test).
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src', 'petriflow-context');
const OUT_FILE = path.resolve(
    __dirname,
    '..',
    'src',
    'app',
    'modeler',
    'services',
    'ai-assistant',
    'generated-petriflow-prompts.ts'
);

function readOrEmpty(filename) {
    const p = path.join(SRC_DIR, filename);
    try {
        return fs.readFileSync(p, 'utf8');
    } catch (e) {
        console.warn(`[embed-petriflow-prompts] missing ${p} — using empty string`);
        return '';
    }
}

// Backtick-safe escape for a TS template literal.
function escapeForTemplate(s) {
    return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const systemPrompt = readOrEmpty('system_prompt.md');
const reference = readOrEmpty('petriflow_reference.md');

const banner = `// AUTO-GENERATED — do not edit by hand.
// Source: src/petriflow-context/*.md
// Re-run: npm run prebuild:prompts
/* eslint-disable */
`;

const content = `${banner}
export const PETRIFLOW_SYSTEM_PROMPT = \`${escapeForTemplate(systemPrompt)}\`;

export const PETRIFLOW_REFERENCE = \`${escapeForTemplate(reference)}\`;
`;

fs.mkdirSync(path.dirname(OUT_FILE), {recursive: true});
fs.writeFileSync(OUT_FILE, content, 'utf8');

console.log(
    `[embed-petriflow-prompts] wrote ${OUT_FILE} ` +
    `(system_prompt=${systemPrompt.length} chars, reference=${reference.length} chars)`
);
