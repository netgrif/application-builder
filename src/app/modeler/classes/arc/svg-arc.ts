export class SvgArc {
  polyciarapod: SVGPolylineElement;
  polyciara: SVGPolylineElement;
  sipka: SVGPolygonElement | SVGCircleElement;
  vahaelem: SVGTextElement;
  vaha: Text;

  constructor(polyciarapod: SVGPolylineElement, polyciara: SVGPolylineElement, sipka, vahaelem: SVGTextElement, vaha: Text) {
    this.polyciarapod = polyciarapod;
    this.polyciara = polyciara;
    this.sipka = sipka;
    this.vahaelem = vahaelem;
    this.vaha = vaha;
  }
}
