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
import { NgForOf, NgIf } from '@angular/common';
import { EditableAction } from '../../modeler/actions-mode/action-editor/classes/editable-action';

export interface AiAssistantDialogData {
    code: string;
    action: EditableAction;
    actionName?: string;
    index?: number;
    leafNodeId?: string | number;
}

export interface AiAssistantDialogResult {
    updatedCode?: string;
}

@Component({
    selector: 'nab-dialog-actions-assistant',
    templateUrl: './dialog-actions-assistant.component.html',
    standalone: true,
    imports: [
        // Angular
        NgIf, NgForOf,
        // Material (standalone)
        MatDialogTitle, MatDialogContent, MatDialogActions,
        MatDivider, MatFormField, MatInput, MatButton
    ]
})
export class DialogActionsAssistantComponent {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    proposedCode: string | undefined;

    constructor(
        private dialogRef: MatDialogRef<DialogActionsAssistantComponent, AiAssistantDialogResult>,
        @Inject(MAT_DIALOG_DATA) public data: AiAssistantDialogData,
    ) {
        // Seed with current editor context
        this.messages.push({
            role: 'system',
            content:
                `Current action content (${data.actionName ?? 'unnamed'}):\n` +
                (data.code?.trim() ? '```petriflow\n' + data.code + '\n```' : '(editor is empty)')
        });
    }

    async onAsk(prompt: string) {
        const trimmed = (prompt || '').trim();
        if (!trimmed) return;

        this.messages.push({ role: 'user', content: trimmed });

        // TODO: wire this to your local AI service (HTTP/WebSocket/etc).
        // For now, we simulate a response with a tiny stub:
        const ai = await this.fakeLocalAi(this.data.code, trimmed);

        this.messages.push({ role: 'assistant', content: ai.explanation });
        this.proposedCode = ai.updatedCode;
    }

    confirm() {
        this.dialogRef.close({ updatedCode: this.proposedCode });
    }

    cancel() {
        this.dialogRef.close();
    }

    // ---- Demo stub (replace with your real local assistant call) ----
    private async fakeLocalAi(current: string, _prompt: string): Promise<{ explanation: string; updatedCode: string }> {
        const updated = (current ?? '').includes('// AI TAG')
            ? current.replace('// AI TAG', '// AI TAG (updated)')
            : (`// AI TAG\n` + (current ?? ''));
        return {
            explanation: `I've prepared an updated proposal. Review the code below and click "Apply" if it looks good.`,
            updatedCode: updated,
        };
    }
}
