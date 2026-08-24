export function pointerCaptureTarget(event: PointerEvent): Element {
    const target = event.target;
    return target instanceof Element && target.setPointerCapture
        ? target
        : event.currentTarget as Element;
}
