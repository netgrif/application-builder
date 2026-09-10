declare module 'monaco-xsd-code-completion/esm/XsdParser' {
    export interface XsdNode {
        name?: string;
        ref?: string;
        type?: string;
        use?: string;
        minOccurs?: string;
        maxOccurs?: string;
        documentation?: string;
    }

    export interface XsdConfiguration {
        path: string;
        value: string;
        namespace?: string;
    }

    export default class XsdParser {
        constructor(xsd: XsdConfiguration);

        getRootElements(): Array<XsdNode>;

        getSubElements(elementName: string): Array<XsdNode>;

        getAttributesForElement(elementName: string): Array<XsdNode>;
    }
}
