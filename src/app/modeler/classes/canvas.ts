import {ModelerConfig} from '../modeler-config';

export class Canvas {

    _svg: SVGSVGElement;

    /**
     * Canvas object to draw the model's components.
     * @param svg - canvas element
     */
    constructor(svg: SVGSVGElement) {
        this._svg = svg;
        this._svg.onselectstart = () => false;
    }

    /**
     * Add element to be drawn in the canvas.
     * @param element - Element to add.
     */
    add(element) {
        this._svg.appendChild(element);
    }

    /**
     * Remove element from the canvas.
     * Removed element will no longer be visible in the canvas.
     * @param element - Element to remove.
     */
    remove(element) {
        this._svg.removeChild(element);
    }

    removeAll() {
        const modelElements = [];
        this._svg.childNodes.forEach((child, index) => {
            if (index < 2) {
                return;
            }
            modelElements.push(child);
        });
        modelElements.forEach(e => this._svg.removeChild(e));
    }

    /**
     * Register callback to the event type (i.e. click, mouseover etc.).
     * @param event - Name of the event to be handled.
     * @param callback - Callback function that will be call when specified event of the canvas occurs.
     */
    on(event, callback) {
        this._svg.addEventListener(event, callback, false);
    }

    /**
     * Change dimensions of the canvas.
     * @param width - width
     * @param height - height
     */
    resize(width, height) {
        this._svg.setAttribute('style', `width:${width}px;height:${height}px;`);
    }

    get svg(): any { // TODO any
        const defs = document.createElementNS(null, 'defs') as HTMLElement;
        const style = document.createElementNS(null, 'style') as HTMLElement;
        style.setAttributeNS(null, 'type', 'text/css');
        style.textContent = '<![CDATA[\n' +
            '    .svg-inactive-stroke { stroke: black !important; }\n' +
            '    .svg-inactive-fill { fill: black !important; }\n' +
            '    .svg-transition-enabled {stroke: green;fill: yellowgreen;}\n' +
            '    .svg-transition-disabled {stroke: red;fill: white;}\n' +
            '    .svg-fire-arrow-cancel-active {fill: coral;stroke: red;}\n' +
            '    .svg-fire-arrow-finish-active {stroke: green;fill: yellowgreen; }\n' +
            '    .svg-fire-arrow-cancel-inactive {fill: none;stroke: none;}\n' +
            '    .svg-fire-arrow-finish-inactive {fill: none;stroke: none;}\n' +
            '    .svg-transition-firing {stroke: green;fill: none;}\n' +
            '    ]]>';
        defs.appendChild(style);
        defs.removeAttribute('xmlns');
        const svg = this._svg.cloneNode(true);
        const nodes = [];
        svg.childNodes.forEach(node => {
            if ((node as Element).getAttributeNS(null, 'style') === `font-family: Material Icons;font-size:${ModelerConfig.ICON_SIZE}`) {
                nodes.push(node);
            }
        });
        nodes.forEach(node => {
            svg.removeChild(node);
        });
        svg.insertBefore(defs, svg.firstChild);
        return svg;
    }
}
