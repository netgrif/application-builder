import { Component, Inject } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { NgForOf, NgIf } from '@angular/common';

import { EditableAction } from '../../modeler/actions-mode/action-editor/classes/editable-action';
import {OpenAiHttpService, OpenAiService} from "../dialog-assistant/service/openai-http.service";

export interface AiAssistantDialogData {
    code: string;
    action: EditableAction;
    actionName?: string;
    index?: number;
    leafNodeId?: string | number;
    context?: string;
}

export interface AiAssistantDialogResult {
    updatedCode?: string;
}

@Component({
    selector: 'nab-dialog-actions-assistant',
    templateUrl: './dialog-actions-assistant.component.html',
    standalone: true,
    imports: [
        NgIf, NgForOf,
        MatDialogTitle, MatDialogContent, MatDialogActions,
        MatDivider, MatFormField, MatInput, MatButton, MatProgressBar
    ],
    providers: [
        // bind abstract token to concrete OpenAI HTTP client
        { provide: OpenAiService, useClass: OpenAiHttpService },
    ],
})
export class DialogActionsAssistantComponent {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    proposedCode: string | undefined;
    isLoading = false;

    constructor(
        private dialogRef: MatDialogRef<DialogActionsAssistantComponent, AiAssistantDialogResult>,
        @Inject(MAT_DIALOG_DATA) public data: AiAssistantDialogData,
        private openai: OpenAiService,
    ) {
        // Seed with current editor context
        this.messages.push({
            role: 'system',
            content:
                `Current action content (${data.actionName ?? 'unnamed'}):\n` +
                (data.code?.trim() ? '```petriflow\n' + data.code + '\n```' : '(editor is empty)')
        });

        if (data?.context?.trim()) {
            this.messages.push({
                role: 'system',
                content: `Context:\n${data.context}`
            });
        }
    }

    async onAsk(prompt: string) {
        const trimmed = (prompt || '').trim();
        if (!trimmed || this.isLoading) return;

        this.messages.push({ role: 'user', content: trimmed });
        this.isLoading = true;

        try {
            const system = this.buildSystemPrompt();
            const user = this.buildUserPrompt(this.data.code || '', trimmed, this.data.context || '');

            const res = await this.openai.generate({
                system,
                user,
                model: 'gpt-4.1-mini',
                maxOutputTokens: 1400,
            });

            const raw = res.text || '';
            const code = this.extractCode(raw);

            this.messages.push({
                role: 'assistant',
                content: code
                    ? 'Generated proposal. Review the code below and click "Apply".'
                    : 'The model did not return code. Please add one more detail and try again.'
            });

            this.proposedCode = code || undefined;
        } catch (e: any) {
            this.messages.push({
                role: 'assistant',
                content: `Error while talking to AI: ${e?.message || e}`
            });
        } finally {
            this.isLoading = false;
        }
    }

    confirm() {
        this.dialogRef.close({ updatedCode: this.proposedCode });
    }

    cancel() {
        this.dialogRef.close();
    }

    // ===== Prompt builders =====

    /** Strict rules for Action Editor DSL + Groovy. */
    private buildSystemPrompt(): string {
        // Few-shot examples (short, but representative)
        const examples = `
EXAMPLE 1 — change a value:
status: f.status;
change status value { "Your request was registered." }

EXAMPLE 2 — call another task (async assign/finish based on boolean):
boolean_0: f.boolean_0;
if (boolean_0.value == true) {
    async.run{
        assignTask("t5")
        finishTask("t5")
    }
} else {
    async.run{
        assignTask("t4")
        finishTask("t4")
    }
}

EXAMPLE 3 — change value + change field property on a task:
t8: t.t8,
text_6: f.text_6,
status: f.status;
change status value { "Below you find your answer." }
make text_6, visible on t8 when { true }

EXAMPLE 4 — larger action with file checks & PDF to HTML preview:
outcome: f.outcome,
pdfHtml: f.pdfHtml,
invoice: f.invoice;
def file = new java.io.File(invoice.value.path)
if (!file.exists() || !file.isFile()) {
    change outcome value { "PDF file not found: \${invoice.value.path}" }
    return
}
def document = org.apache.pdfbox.pdmodel.PDDocument.load(file)
def renderer = new org.apache.pdfbox.rendering.PDFRenderer(document)
def image = renderer.renderImageWithDPI(0, 100)
def baos = new java.io.ByteArrayOutputStream()
javax.imageio.ImageIO.write(image, "png", baos)
document.close()
def base64 = java.util.Base64.encoder.encodeToString(baos.toByteArray())
def html = "<img src='data:image/png;base64,\${base64}' style='max-width:100%;height:auto;'/>"
change pdfHtml value { html.toString() }
`.trim();

        return [
            `You are an assistant that generates ACTION scripts for Netgrif Action Editor.`,
            `STRICT FORMAT RULES (no prose, no markdown):`,
            `1) First, declare aliases for ALL fields/tasks you will use, on a single header block,`,
            `   using the exact syntax:`,
            `      <alias_field>: f.<fieldId>,`,
            `      <alias_task>:  t.<taskId>;`,
            `   Notes:`,
            `   - Separate items by commas; end the alias header with semicolon.`,
            `   - Use real IDs from Context when possible; do not invent IDs.`,
            `2) Then write Groovy code using ONLY the following primitives and Java/Groovy standard library:`,
            `   - Read/write field values via <alias_field>.value`,
            `   - change <alias_field> value { <expression> }`,
            `   - make <alias_field>, <property> on <alias_task> when { <condition> }  (e.g., visible/hidden/editable/required/optional)`,
            `   - async.run{ assignTask("<taskId>"); finishTask("<taskId>") }`,
            `3) When editor already contains code, APPLY MINIMAL DIFFS: keep existing alias header as-is`,
            `   and append/update only what is necessary.`,
            `4) NEVER output JSON or explanations. Output CODE ONLY.`,
            ``,
            `STYLE: concise, readable; prefer explicit alias lines and clear blocks.`,
            ``,
            `VALID PROPERTIES for 'make ... on ...': visible | hidden | editable | required | optional`,
            ``,
            `EXAMPLES (follow structure exactly):`,
            examples,
        ].join('\n');
    }

    /** Build user message with current code + model context + user intent. */
    private buildUserPrompt(currentCode: string, userRequest: string, context: string): string {
        const current = currentCode?.trim()
            ? `CURRENT_CODE:\n---\n${currentCode}\n---\n`
            : `CURRENT_CODE: (empty)\n`;

        const ctx = context?.trim()
            ? `CONTEXT:\n${context}\n`
            : `CONTEXT: (none)\n`;

        return [
            ctx,
            current,
            `USER_REQUEST:\n${userRequest}\n`,
            `OUTPUT: Return CODE ONLY that follows the STRICT FORMAT RULES.`,
        ].join('\n');
    }

    /** Extract raw code (remove accidental fences/markdown). */
    private extractCode(text: string): string {
        if (!text) return '';
        // take fenced code if present
        const fenced = text.match(/```[a-zA-Z0-9_-]*\s*([\s\S]*?)```/);
        const body = fenced ? fenced[1] : text;
        // trim and ensure it starts with alias lines or identifiers we expect
        return body.trim();
    }
}
