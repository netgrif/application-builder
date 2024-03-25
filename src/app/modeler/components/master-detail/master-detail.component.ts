import {AfterViewInit, Component, ElementRef, Injector, Input, OnInit, ViewChild} from '@angular/core';
import {CdkPortalOutlet, ComponentPortal} from '@angular/cdk/portal';
import {ComponentType} from '@angular/cdk/overlay';

@Component({
    selector: 'nab-master-detail',
    templateUrl: './master-detail.component.html',
    styleUrl: './master-detail.component.scss'
})
export class MasterDetailComponent implements OnInit, AfterViewInit {

    @Input() minWidth = 20;
    @Input() maxWidth = 50;
    @Input() defaultWidth = 30;
    // TODO: any
    @Input() masterComponent: ComponentType<any>;
    @Input() detailComponent: ComponentType<any>;
    masterPortal: ComponentPortal<any>;
    detailPortal: ComponentPortal<any>;

    constructor(private _parentInjector: Injector) {
    }

    ngOnInit(): void {
        const injector = Injector.create({
            providers: [],
            parent: this._parentInjector
        });
        this.masterPortal = new ComponentPortal(this.masterComponent, null, injector);
        this.detailPortal = new ComponentPortal(this.detailComponent, null, injector);
    }

    ngAfterViewInit(): void {
    }
}
