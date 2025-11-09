// src/app/dialogs/dialog-assistant/utils/scrolling.service.ts
import { ElementRef, Injectable } from '@angular/core';

/**
 * Provides helper methods for smooth scrolling inside the dialog assistant.
 * Keeps scroll logic out of the main component.
 */
@Injectable({ providedIn: 'root' })
export class ScrollingService {
    /** Scroll smoothly to the bottom of the given scrollable container. */
    scrollToBottom(elRef?: ElementRef<HTMLElement> | null, smooth = true): void {
        if (!elRef?.nativeElement) return;
        const el = elRef.nativeElement;

        try {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto',
            });
        } catch {
            // fallback for older browsers
            el.scrollTop = el.scrollHeight;
        }
    }

    /** Scroll instantly to the top of the given container. */
    scrollToTop(elRef?: ElementRef<HTMLElement> | null): void {
        if (!elRef?.nativeElement) return;
        elRef.nativeElement.scrollTop = 0;
    }

    /** Return true if the user is already near the bottom (e.g., autoscroll trigger). */
    isNearBottom(elRef?: ElementRef<HTMLElement> | null, thresholdPx = 40): boolean {
        if (!elRef?.nativeElement) return false;
        const el = elRef.nativeElement;
        const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
        return distance < thresholdPx;
    }
}
