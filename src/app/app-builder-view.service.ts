import {ConfigurationService, LoggerService, ViewService} from '@netgrif/components-core';
import {Router} from '@angular/router';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppBuilderViewService extends ViewService {
  constructor(configurationService: ConfigurationService, router: Router, loggerService: LoggerService) {
    // This class is managed by schematics. Do not modify it by hand.
    // If you want to add views to the application run the 'create-view' schematic.
    super([], configurationService, router, loggerService);
  }
}
