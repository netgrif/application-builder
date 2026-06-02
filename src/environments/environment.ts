// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import packageJson from '../../package.json';

export const environment = {
    production: false,
    deployUrl: '/',
    version: packageJson.version,
    ai: {
        defaultProvider: 'claude' as 'claude' | 'openai' | 'gemini',
        defaultModels: {
            claude: 'claude-sonnet-4-6',
            openai: 'gpt-4o',
            gemini: 'gemini-2.5-pro'
        },
        availableModels: {
            claude: [
                {id: 'claude-opus-4-7',   label: 'Claude Opus 4.7'},
                {id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6'},
                {id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5'}
            ],
            openai: [
                {id: 'gpt-4o',      label: 'GPT-4o'},
                {id: 'gpt-4o-mini', label: 'GPT-4o mini'},
                {id: 'o4-mini',     label: 'o4-mini'}
            ],
            gemini: [
                {id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro'},
                {id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash'}
            ]
        },
        timeouts: {
            requestMs: 90_000,
            idleStreamMs: 30_000
        },
        retry: {
            attempts: 2,
            backoffMs: 1200
        }
    }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
