export interface MouseListener {

    /**
     * Triggers when a mouse button is pressed over the element
     */
    onMouseDown(event: MouseEvent): void;

    /**
     * Triggers when a mouse button is released over the element
     */
    onMouseUp(event: MouseEvent): void;

    /**
     * Triggers when the user clicks on the element
     */
    onMouseClick(event: MouseEvent): void;

    /**
     * Triggers when the user double-clicks on the element
     */
    onMouseDoubleClick(event: MouseEvent): void;

    /**
     * Triggers when the mouse pointer enters the element
     */
    onMouseEnter(event: MouseEvent): void;

    /**
     * Triggers when the mouse pointer enters the element
     */
    onMouseLeave(event: MouseEvent): void;

    /**
     * Triggers every time the mouse pointer is moved over the element
     */
    onMouseMove(event: MouseEvent): void;

    /**
     * Triggers when the mouse pointer leaves the element and its child elements
     */
    onMouseOut(event: MouseEvent): void;

    /**
     * Triggers when the mouse pointer enters the element and its child elements
     */
    onMouseOver(event: MouseEvent): void;

    /**
     * Triggers when the user right-clicks on the element
     */
    onContextMenu(event: MouseEvent): void;
}
