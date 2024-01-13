import {Injectable} from '@angular/core';
import {ConfigurationService} from '@netgrif/components-core';
import {NetgrifApplicationEngine} from '@netgrif/components-core/';
import {default as naeConfig} from '../../nae.json';

@Injectable({
  providedIn: 'root',
})
export class AppBuilderConfigurationService extends ConfigurationService {
  constructor() {
    super(naeConfig as unknown as NetgrifApplicationEngine);
    this.resolveConfigFromEnv();
  }

  private resolveConfigFromEnv() {
    if (!window['env']) return;
    Object.keys(window['env']).forEach(key => {
      const parts = key.split('-');
      let obj = this.configuration;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      if (!!window['env'][key] && window['env'][key] !== '') {
        obj[parts[parts.length - 1]] = window['env'][key];
      }
    });
  }
}
