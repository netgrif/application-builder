import {NgModule} from '@angular/core';
import {CdkTreeModule} from '@angular/cdk/tree';
import {CdkPortal, CdkPortalOutlet} from '@angular/cdk/portal';

@NgModule({
    declarations: [],
    imports: [
        CdkPortalOutlet,
        CdkTreeModule
    ]
})
export class CdkImportModule {
}
