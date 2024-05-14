import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '@angular/common';

const routes: Routes = [];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule, CommonModule]
})
export class AppRoutingModule {
}
