import {AfterViewInit, Component, Injector, Input, OnInit, ViewChild} from '@angular/core';
import {CdkPortalOutlet, ComponentPortal} from '@angular/cdk/portal';
import {ComponentType} from '@angular/cdk/overlay';

@Component({
    selector: 'nab-master-detail',
    standalone: true,
    imports: [
        CdkPortalOutlet
    ],
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
    @ViewChild('border') borderElement;
    @ViewChild('master') masterElement;
    @ViewChild('detail') detailElement;
    private _isMouseDown = false;
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
        this.borderElement.nativeElement.addEventListener('mousedown', this.mouseDown.bind(this));
        this.masterElement.nativeElement.style.flexBasis = `${this.defaultWidth}%`;
    }

    mouseDown() {
        this._isMouseDown = true;
        document.body.addEventListener('mousemove', this.mouseMove.bind(this));
        document.body.addEventListener('mouseup', this.mouseUp.bind(this));
    }

    mouseMove(event: MouseEvent): void {
        if (this._isMouseDown) {
            this.resize(event);
        } else {
            this.mouseUp();
        }
    }

    private resize(event) {
        const width = this.calculateWidth(event);
        if (this.isWithinBounds(width)) {
            this.masterElement.nativeElement.style.flexBasis = `${width}%`;
        }
    }

    private calculateWidth(event): number {
        const masterBounding = this.masterElement.nativeElement.getBoundingClientRect();
        const containerBounding = this.detailElement.nativeElement.getBoundingClientRect();
        return ((event.clientX - masterBounding.x) / containerBounding.width) * 100;
    }

    private isWithinBounds(width: number) {
        return width >= this.minWidth && width <= this.maxWidth;
    }

    mouseUp() {
        this._isMouseDown = false;
        document.body.removeEventListener('mouseup', this.mouseUp);
        this.borderElement.nativeElement.removeEventListener('mousemove', this.mouseMove);
    }
}
