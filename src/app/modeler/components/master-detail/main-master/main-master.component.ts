import {Component, Injector, OnInit} from '@angular/core';
import {PageMasterComponent} from '../page-master.component';

@Component({
    selector: 'nab-main-master',
    templateUrl: './main-master.component.html',
    styleUrl: './main-master.component.scss'
})
export class MainMasterComponent extends PageMasterComponent implements OnInit {

    constructor() {
        super();
    }
}
