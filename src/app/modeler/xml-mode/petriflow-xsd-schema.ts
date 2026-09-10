import type {XsdNode} from 'monaco-xsd-code-completion/esm/XsdParser';

const XSD_NAMESPACE = 'http://www.w3.org/2001/XMLSchema';

export interface PetriflowXsdAttribute extends XsdNode {
    values: ReadonlyArray<string>;
}

interface PetriflowXsdParticle {
    elements: Array<Element>;
    minOccurs: number;
    maxOccurs: number;
}

export class PetriflowXsdSchema {
    private readonly complexTypes = new Map<string, Element>();
    private readonly simpleTypes = new Map<string, Element>();
    private readonly groups = new Map<string, Element>();
    private readonly attributeGroups = new Map<string, Element>();
    private readonly rootElements = new Map<string, Element>();

    constructor(schema: string) {
        const schemaDocument = new DOMParser().parseFromString(schema, 'application/xml');
        this.indexNamedElements(schemaDocument, 'complexType', this.complexTypes);
        this.indexNamedElements(schemaDocument, 'simpleType', this.simpleTypes);
        this.indexNamedElements(schemaDocument, 'group', this.groups);
        this.indexNamedElements(schemaDocument, 'attributeGroup', this.attributeGroups);
        this.children(schemaDocument.documentElement)
            .filter(element => element.localName === 'element')
            .forEach(element => {
                const name = element.getAttribute('name');
                if (name) {
                    this.rootElements.set(name, element);
                }
            });
    }

    getSubElements(path: ReadonlyArray<string>): Array<XsdNode> | undefined {
        if (!path.length) {
            return Array.from(this.rootElements.values()).map(element => this.toNode(element));
        }
        const declaration = this.resolveElement(path);
        if (!declaration) {
            return undefined;
        }
        return this.collectParticles(declaration).reduce((elements, particle) => {
            elements.push(...particle.elements.map(element => this.toNode(element, particle)));
            return elements;
        }, new Array<XsdNode>());
    }

    getExpectedSubElements(path: ReadonlyArray<string>, existingChildren: ReadonlyArray<string>): Array<XsdNode> | undefined {
        const declaration = this.resolveElement(path);
        if (!declaration) {
            return undefined;
        }
        const particles = this.collectParticles(declaration);
        const occurrences = new Map<number, number>();
        let particleIndex = 0;

        existingChildren.forEach(childName => {
            let matched = false;
            while (!matched && particleIndex < particles.length) {
                const particle = particles[particleIndex];
                const count = occurrences.get(particleIndex) || 0;
                const matches = particle.elements.some(element => this.elementName(element) === this.localName(childName));
                if (matches && count < particle.maxOccurs) {
                    occurrences.set(particleIndex, count + 1);
                    matched = true;
                    if (count + 1 >= particle.maxOccurs) {
                        particleIndex++;
                    }
                } else if (count >= particle.minOccurs) {
                    particleIndex++;
                } else {
                    return;
                }
            }
        });

        const expected = new Array<XsdNode>();
        for (let index = particleIndex; index < particles.length; index++) {
            const particle = particles[index];
            const count = occurrences.get(index) || 0;
            if (count < particle.maxOccurs) {
                expected.push(...particle.elements.map(element => this.toNode(element, particle)));
            }
            if (count < particle.minOccurs) {
                break;
            }
        }
        return expected;
    }

    getRequiredSubElements(path: ReadonlyArray<string>): Array<XsdNode> | undefined {
        const declaration = this.resolveElement(path);
        if (!declaration) {
            return undefined;
        }
        const required = new Array<XsdNode>();
        this.collectParticles(declaration).forEach(particle => {
            for (let occurrence = 0; occurrence < particle.minOccurs; occurrence++) {
                const element = particle.elements[0];
                if (element) {
                    required.push(this.toNode(element, particle));
                }
            }
        });
        return required;
    }

    getAttributes(path: ReadonlyArray<string>): Array<PetriflowXsdAttribute> | undefined {
        const declaration = this.resolveElement(path);
        if (!declaration) {
            return undefined;
        }
        return this.collectAttributes(declaration).map(element => ({
            ...this.toNode(element),
            values: this.attributeValues(element),
        }));
    }

    private resolveElement(path: ReadonlyArray<string>): Element | undefined {
        let declaration = this.rootElements.get(this.localName(path[0]));
        for (let index = 1; declaration && index < path.length; index++) {
            const name = this.localName(path[index]);
            declaration = this.collectElements(declaration).find(element => {
                return this.localName(element.getAttribute('name') || element.getAttribute('ref')) === name;
            });
        }
        return declaration;
    }

    private collectElements(declaration: Element): Array<Element> {
        return this.collectParticles(declaration).reduce((elements, particle) => {
            elements.push(...particle.elements);
            return elements;
        }, new Array<Element>());
    }

    private collectParticles(declaration: Element): Array<PetriflowXsdParticle> {
        const complexType = this.complexType(declaration);
        if (!complexType) {
            return [];
        }
        const result = new Array<PetriflowXsdParticle>();
        this.walkParticles(complexType, result, new Set<Element>());
        return result;
    }

    private walkParticles(node: Element, result: Array<PetriflowXsdParticle>, visited: Set<Element>): void {
        if (visited.has(node)) {
            return;
        }
        visited.add(node);
        this.children(node).forEach(child => {
            if (child.localName === 'element') {
                result.push({
                    elements: [child],
                    minOccurs: this.occurrence(child, 'minOccurs', 1),
                    maxOccurs: this.occurrence(child, 'maxOccurs', 1),
                });
                return;
            }
            if (child.localName === 'choice') {
                const elements = this.choiceElements(child, new Set<Element>());
                const childMaximum = elements.some(element => this.occurrence(element, 'maxOccurs', 1) === Infinity)
                    ? Infinity
                    : Math.max(1, ...elements.map(element => this.occurrence(element, 'maxOccurs', 1)));
                result.push({
                    elements,
                    minOccurs: this.occurrence(child, 'minOccurs', 1),
                    maxOccurs: this.multiplyOccurrences(this.occurrence(child, 'maxOccurs', 1), childMaximum),
                });
                return;
            }
            if (child.localName === 'group') {
                const group = this.groups.get(this.localName(child.getAttribute('ref')));
                if (group) {
                    this.walkParticles(group, result, visited);
                }
                return;
            }
            if (child.localName === 'extension' || child.localName === 'restriction') {
                const baseType = this.complexTypes.get(this.localName(child.getAttribute('base')));
                if (baseType) {
                    this.walkParticles(baseType, result, visited);
                }
            }
            if (this.isContentContainer(child)) {
                this.walkParticles(child, result, visited);
            }
        });
    }

    private choiceElements(choice: Element, visited: Set<Element>): Array<Element> {
        if (visited.has(choice)) {
            return [];
        }
        visited.add(choice);
        const elements = new Array<Element>();
        this.children(choice).forEach(child => {
            if (child.localName === 'element') {
                elements.push(child);
            } else if (child.localName === 'group') {
                const group = this.groups.get(this.localName(child.getAttribute('ref')));
                if (group) {
                    elements.push(...this.choiceElements(group, visited));
                }
            } else if (this.isContentContainer(child)) {
                elements.push(...this.choiceElements(child, visited));
            }
        });
        return elements;
    }

    private collectAttributes(declaration: Element): Array<Element> {
        const complexType = this.complexType(declaration);
        if (!complexType) {
            return [];
        }
        const result = new Array<Element>();
        this.walkAttributes(complexType, result, new Set<Element>());
        return result;
    }

    private walkAttributes(node: Element, result: Array<Element>, visited: Set<Element>): void {
        if (visited.has(node)) {
            return;
        }
        visited.add(node);
        this.children(node).forEach(child => {
            if (child.localName === 'attribute') {
                result.push(child);
                return;
            }
            if (child.localName === 'attributeGroup') {
                const group = this.attributeGroups.get(this.localName(child.getAttribute('ref')));
                if (group) {
                    this.walkAttributes(group, result, visited);
                }
                return;
            }
            if (child.localName === 'extension' || child.localName === 'restriction') {
                const baseType = this.complexTypes.get(this.localName(child.getAttribute('base')));
                if (baseType) {
                    this.walkAttributes(baseType, result, visited);
                }
            }
            if (this.isContentContainer(child)) {
                this.walkAttributes(child, result, visited);
            }
        });
    }

    private complexType(declaration: Element): Element | undefined {
        const type = declaration.getAttribute('type');
        if (type) {
            return this.complexTypes.get(this.localName(type));
        }
        return this.children(declaration).find(element => element.localName === 'complexType');
    }

    private attributeValues(attribute: Element): Array<string> {
        const type = attribute.getAttribute('type');
        if (this.localName(type) === 'boolean') {
            return ['true', 'false'];
        }
        const simpleType = type
            ? this.simpleTypes.get(this.localName(type))
            : this.children(attribute).find(element => element.localName === 'simpleType');
        if (!simpleType) {
            return [];
        }
        return Array.from(simpleType.getElementsByTagNameNS(XSD_NAMESPACE, 'enumeration'))
            .map(element => element.getAttribute('value'))
            .filter(value => value !== null);
    }

    private indexNamedElements(document: Document, localName: string, target: Map<string, Element>): void {
        Array.from(document.getElementsByTagNameNS(XSD_NAMESPACE, localName)).forEach(element => {
            const name = element.getAttribute('name');
            if (name) {
                target.set(name, element);
            }
        });
    }

    private children(element: Element): Array<Element> {
        return Array.from(element.children);
    }

    private isContentContainer(element: Element): boolean {
        return ['sequence', 'all', 'choice', 'complexContent', 'simpleContent', 'extension', 'restriction'].includes(element.localName);
    }

    private occurrence(element: Element, attribute: string, defaultValue: number): number {
        const value = element.getAttribute(attribute);
        if (!value) {
            return defaultValue;
        }
        return value === 'unbounded' ? Infinity : Number(value);
    }

    private multiplyOccurrences(first: number, second: number): number {
        return first === Infinity || second === Infinity ? Infinity : first * second;
    }

    private elementName(element: Element): string {
        return this.localName(element.getAttribute('name') || element.getAttribute('ref'));
    }

    private toNode(element: Element, particle?: PetriflowXsdParticle): XsdNode {
        return {
            name: element.getAttribute('name') || undefined,
            ref: element.getAttribute('ref') || undefined,
            type: element.getAttribute('type') || undefined,
            use: element.getAttribute('use') || undefined,
            minOccurs: particle ? this.occurrenceText(particle.minOccurs) : element.getAttribute('minOccurs') || undefined,
            maxOccurs: particle ? this.occurrenceText(particle.maxOccurs) : element.getAttribute('maxOccurs') || undefined,
            documentation: this.documentation(element),
        };
    }

    private occurrenceText(value: number): string {
        return value === Infinity ? 'unbounded' : String(value);
    }

    private documentation(element: Element): string {
        return Array.from(element.getElementsByTagNameNS(XSD_NAMESPACE, 'documentation'))
            .map(documentation => documentation.textContent?.trim())
            .filter(value => !!value)
            .join('\n');
    }

    private localName(name: string | null | undefined): string {
        if (!name) {
            return '';
        }
        const parts = name.split(':');
        return parts[parts.length - 1];
    }
}
