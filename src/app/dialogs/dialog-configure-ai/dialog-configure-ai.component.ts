import {Component, Inject} from '@angular/core';
import {MatFormField, MatLabel, MatSuffix, MatHint} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatOption, MatSelect} from '@angular/material/select';
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle
} from '@angular/material/dialog';
import {FlexModule} from '@ngbracket/ngx-layout';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {environment} from '../../../environments/environment';

export type AiProviderId = 'claude' | 'openai' | 'gemini';

export interface AiConfigurationData {
    provider: AiProviderId;
    model:    string;
    keys: {
        claude?: string;
        openai?: string;
        gemini?: string;
    };
}

@Component({
    selector: 'nab-dialog-configure-ai',
    standalone: true,
    imports: [
        MatFormField,
        MatLabel,
        MatHint,
        MatSuffix,
        MatInput,
        MatButton,
        MatIconButton,
        MatIcon,
        MatSelect,
        MatOption,
        MatDialogActions,
        MatDialogClose,
        FlexModule,
        MatDialogContent,
        MatDialogTitle,
        FormsModule,
        NgForOf,
        NgIf
    ],
    templateUrl: './dialog-configure-ai.component.html',
    styleUrl: './dialog-configure-ai.component.scss'
})
export class DialogConfigureAiComponent {

    public providers: Array<{id: AiProviderId; label: string}> = [
        {id: 'claude', label: 'Anthropic Claude'},
        {id: 'openai', label: 'OpenAI'},
        {id: 'gemini', label: 'Google Gemini'}
    ];

    public provider: AiProviderId;
    public model: string;
    public keys: {claude: string; openai: string; gemini: string};

    public showKey = {claude: false, openai: false, gemini: false};

    constructor(@Inject(MAT_DIALOG_DATA) public data: AiConfigurationData) {
        this.provider = data?.provider || environment.ai.defaultProvider;
        this.model = data?.model || environment.ai.defaultModels[this.provider];
        this.keys = {
            claude: data?.keys?.claude || '',
            openai: data?.keys?.openai || '',
            gemini: data?.keys?.gemini || ''
        };
    }

    public get availableModels() {
        return environment.ai.availableModels[this.provider] || [];
    }

    public onProviderChange(): void {
        const models = this.availableModels.map(m => m.id);
        if (!models.includes(this.model)) {
            this.model = environment.ai.defaultModels[this.provider];
        }
    }

    public buildResult(): AiConfigurationData {
        return {
            provider: this.provider,
            model: this.model,
            keys: {
                claude: this.keys.claude.trim() || undefined,
                openai: this.keys.openai.trim() || undefined,
                gemini: this.keys.gemini.trim() || undefined
            }
        };
    }

    public canSave(): boolean {
        const k = this.keys[this.provider];
        return !!(this.provider && this.model && k && k.trim());
    }
}
