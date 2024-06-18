import {Component, Injector, OnInit} from '@angular/core';
import {PageMaster} from '../page-master';

@Component({
    selector: 'nab-main-master',
    templateUrl: './main-master.component.html',
    styleUrl: './main-master.component.scss'
})
export class MainMasterComponent extends PageMaster implements OnInit {

    constructor() {
        super();
    }
}
