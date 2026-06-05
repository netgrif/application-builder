import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatRippleModule} from '@angular/material/core';

@Component({
    selector: 'nab-mode-select-overlay',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatRippleModule],
    templateUrl: './mode-select-overlay.component.html',
    styleUrl: './mode-select-overlay.component.scss'
})
export class ModeSelectOverlayComponent {
    @Output() selectBpmn = new EventEmitter<void>();
    @Output() selectPetriflow = new EventEmitter<void>();
}
