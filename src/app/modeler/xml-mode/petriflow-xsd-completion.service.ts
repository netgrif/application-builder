import {Injectable} from '@angular/core';
import XsdParser, {XsdNode} from 'monaco-xsd-code-completion/esm/XsdParser';
import {PetriflowXsdAttribute, PetriflowXsdSchema} from './petriflow-xsd-schema';
import {PETRIFLOW_XML_LANGUAGE_ID} from './petriflow-xml-language';

declare const monaco: any;

@Injectable({providedIn: 'root'})
export class PetriflowXsdCompletionService {
    register(schema: string, schemaPath: string): {dispose(): void} {
        const parser = new XsdParser({
            path: schemaPath,
            value: schema,
            namespace: 'xs',
        });
        const xsdSchema = new PetriflowXsdSchema(schema);
        return monaco.languages.registerCompletionItemProvider(PETRIFLOW_XML_LANGUAGE_ID, {
            triggerCharacters: ['<', ' ', '/', '=', '"', '\''],
            provideCompletionItems: (model, position) => this.provideCompletionItems(parser, xsdSchema, model, position),
        });
    }

    private provideCompletionItems(
        parser: XsdParser,
        xsdSchema: PetriflowXsdSchema,
        model: any,
        position: any,
    ): {suggestions: Array<any>} {
        const text = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        });
        if (text.lastIndexOf('<![CDATA[') > text.lastIndexOf(']]>')) {
            return {suggestions: []};
        }
        const fragment = this.currentTagFragment(text);
        const stack = this.openElementStack(text);

        if (fragment?.startsWith('/')) {
            return {suggestions: this.closingTagSuggestions(stack, model, position)};
        }
        if (fragment && /\s/.test(fragment)) {
            const valueSuggestions = this.attributeValueSuggestions(xsdSchema, stack, fragment, position);
            if (valueSuggestions !== undefined) {
                return {suggestions: valueSuggestions};
            }
            return {suggestions: this.attributeSuggestions(parser, xsdSchema, stack, fragment, model, position)};
        }
        return {suggestions: this.elementSuggestions(parser, xsdSchema, stack, fragment, model, position)};
    }

    private elementSuggestions(
        parser: XsdParser,
        xsdSchema: PetriflowXsdSchema,
        stack: Array<string>,
        fragment: string | undefined,
        model: any,
        position: any,
    ): Array<any> {
        const path = stack.map(element => this.localName(element));
        const parent = path.length ? path[path.length - 1] : undefined;
        const existingChildren = this.directChildNames(model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        }), path);
        const elements = xsdSchema.getExpectedSubElements(path, existingChildren)
            ?? (parent ? parser.getSubElements(parent) : parser.getRootElements());
        const range = this.wordRange(model, position);
        const startsInsideTag = fragment !== undefined;
        const names = new Set<string>();

        return elements.reduce((suggestions, element, index) => {
            const name = this.nodeName(element);
            if (!name || names.has(name)) {
                return suggestions;
            }
            names.add(name);
            const attributes = (xsdSchema.getAttributes([...path, name]) ?? parser.getAttributesForElement(name).map(attribute => ({
                ...attribute,
                values: [],
            }))).filter(attribute => attribute.use === 'required');
            const requiredAttributes = attributes.map((attribute, attributeIndex) => {
                const attributeName = this.nodeName(attribute);
                if (!attributeName) {
                    return '';
                }
                const value = this.attributeSnippetValue(attribute, attributeIndex + 1);
                return ` ${attributeName}="${value}"`;
            }).join('');
            const opening = startsInsideTag ? '' : '<';
            const requiredChildren = xsdSchema.getRequiredSubElements([...path, name]) ?? [];
            const requiredContent = requiredChildren.map((child, childIndex) => {
                const childName = this.nodeName(child);
                const childTabStop = attributes.length + childIndex + 1;
                return childName ? `\n\t<${childName}>\${${childTabStop}}</${childName}>` : '';
            }).join('');
            const tabStop = attributes.length + requiredChildren.length + 1;
            suggestions.push({
                label: name,
                kind: monaco.languages.CompletionItemKind.Field,
                detail: this.elementDetail(element),
                insertText: `${opening}${name}${requiredAttributes}>${requiredContent}\n\t\${${tabStop}}\n</${name}>`,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: this.elementDocumentation(element, parent),
                range,
                sortText: String(index).padStart(5, '0'),
            });
            return suggestions;
        }, [] as Array<any>);
    }

    private attributeSuggestions(
        parser: XsdParser,
        xsdSchema: PetriflowXsdSchema,
        stack: Array<string>,
        fragment: string,
        model: any,
        position: any,
    ): Array<any> {
        const elementName = this.localName(fragment.trim().split(/\s+/)[0]);
        const usedAttributes = new Set<string>();
        const attributePattern = /\s+([A-Za-z_][\w:.-]*)\s*=/g;
        let attributeMatch: RegExpExecArray;
        while ((attributeMatch = attributePattern.exec(fragment)) !== null) {
            usedAttributes.add(this.localName(attributeMatch[1]));
        }
        const range = this.wordRange(model, position);
        const path = [...stack.map(element => this.localName(element)), elementName];
        const attributes = xsdSchema.getAttributes(path) ?? parser.getAttributesForElement(elementName).map(attribute => ({
            ...attribute,
            values: [],
        }));
        return attributes
            .filter(attribute => {
                const name = this.nodeName(attribute);
                return name && !usedAttributes.has(name);
            })
            .map((attribute, index) => {
                const name = this.nodeName(attribute);
                return {
                    label: name,
                    kind: monaco.languages.CompletionItemKind.Property,
                    detail: this.attributeDetail(attribute),
                    insertText: `${name}="${this.attributeSnippetValue(attribute, 1)}"`,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: this.documentation(attribute),
                    range,
                    sortText: `${attribute.use === 'required' ? '0' : '1'}${String(index).padStart(5, '0')}`,
                    preselect: attribute.use === 'required',
                };
            });
    }

    private attributeValueSuggestions(
        xsdSchema: PetriflowXsdSchema,
        stack: Array<string>,
        fragment: string,
        position: any,
    ): Array<any> | undefined {
        const valueContext = fragment.match(/\s+([A-Za-z_][\w:.-]*)\s*=\s*["']([^"']*)$/);
        if (!valueContext) {
            return undefined;
        }
        const elementName = this.localName(fragment.trim().split(/\s+/)[0]);
        const attributeName = this.localName(valueContext[1]);
        const path = [...stack.map(element => this.localName(element)), elementName];
        const attribute = xsdSchema.getAttributes(path)?.find(candidate => this.nodeName(candidate) === attributeName);
        if (!attribute) {
            return [];
        }
        const value = valueContext[2];
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column - value.length,
            endColumn: position.column,
        };
        return attribute.values.map((candidate, index) => ({
            label: candidate,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: candidate,
            detail: `${elementName}.${attributeName}`,
            range,
            sortText: String(index).padStart(5, '0'),
        }));
    }

    private closingTagSuggestions(stack: Array<string>, model: any, position: any): Array<any> {
        if (!stack.length) {
            return [];
        }
        const name = stack[stack.length - 1];
        return [{
            label: `/${name}`,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: 'Close current element',
            insertText: `${name}>`,
            range: this.wordRange(model, position),
        }];
    }

    private currentTagFragment(text: string): string | undefined {
        const openingIndex = text.lastIndexOf('<');
        return openingIndex > text.lastIndexOf('>') ? text.slice(openingIndex + 1) : undefined;
    }

    private openElementStack(text: string): Array<string> {
        const completeText = this.currentTagFragment(text) === undefined ? text : text.slice(0, text.lastIndexOf('<'));
        const sanitized = completeText
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<!\[CDATA\[[\s\S]*?]]>/g, '')
            .replace(/<\?[\s\S]*?\?>/g, '');
        const stack = new Array<string>();
        const tagPattern = /<(\/?)\s*([A-Za-z_][\w:.-]*)(?:\s[^<>]*?)?(\/?)>/g;
        let match: RegExpExecArray;

        while ((match = tagPattern.exec(sanitized)) !== null) {
            if (match[1]) {
                const closingName = this.localName(match[2]);
                const matchingIndex = this.lastMatchingElementIndex(stack, closingName);
                if (matchingIndex !== -1) {
                    stack.splice(matchingIndex);
                }
            } else if (!match[3]) {
                stack.push(match[2]);
            }
        }
        return stack;
    }

    private directChildNames(text: string, parentPath: ReadonlyArray<string>): Array<string> {
        if (!parentPath.length) {
            return [];
        }
        const completeText = this.currentTagFragment(text) === undefined ? text : text.slice(0, text.lastIndexOf('<'));
        const sanitized = completeText
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<!\[CDATA\[[\s\S]*?]]>/g, '')
            .replace(/<\?[\s\S]*?\?>/g, '');
        const stack = new Array<string>();
        const children = new Array<string>();
        const tagPattern = /<(\/?)\s*([A-Za-z_][\w:.-]*)(?:\s[^<>]*?)?(\/?)>/g;
        let match: RegExpExecArray;

        while ((match = tagPattern.exec(sanitized)) !== null) {
            const name = this.localName(match[2]);
            if (match[1]) {
                const matchingIndex = this.lastMatchingElementIndex(stack, name);
                if (matchingIndex !== -1) {
                    stack.splice(matchingIndex);
                }
                continue;
            }
            if (this.stackMatchesPath(stack, parentPath)) {
                children.push(name);
            }
            if (!match[3]) {
                stack.push(match[2]);
            }
        }
        return children;
    }

    private stackMatchesPath(stack: ReadonlyArray<string>, path: ReadonlyArray<string>): boolean {
        return stack.length === path.length && stack.every((element, index) => this.localName(element) === path[index]);
    }

    private lastMatchingElementIndex(stack: Array<string>, name: string): number {
        for (let index = stack.length - 1; index >= 0; index--) {
            if (this.localName(stack[index]) === name) {
                return index;
            }
        }
        return -1;
    }

    private wordRange(model: any, position: any): any {
        const word = model.getWordUntilPosition(position);
        return {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        };
    }

    private nodeName(node: XsdNode): string | undefined {
        const name = node.name || node.ref;
        return name ? this.localName(name) : undefined;
    }

    private attributeSnippetValue(attribute: PetriflowXsdAttribute, tabStop: number): string {
        if (!attribute.values.length) {
            return `\${${tabStop}}`;
        }
        const values = attribute.values.map(value => value.replace(/([\\,|])/g, '\\$1')).join(',');
        return `\${${tabStop}|${values}|}`;
    }

    private localName(name: string): string {
        const parts = name.split(':');
        return parts[parts.length - 1];
    }

    private documentation(node: XsdNode): string {
        return (node.documentation || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    private elementDetail(element: XsdNode): string {
        const type = element.type ? this.localName(element.type) : 'inline type';
        const occurrence = element.minOccurs === '0' ? 'optional' : 'required';
        const repeatable = element.maxOccurs === 'unbounded' || Number(element.maxOccurs) > 1 ? 'repeatable' : undefined;
        return [type, occurrence, repeatable].filter(value => !!value).join(' · ');
    }

    private elementDocumentation(element: XsdNode, parent: string | undefined): string {
        const documentation = this.documentation(element);
        if (documentation) {
            return documentation;
        }
        return parent ? `Allowed inside <${parent}> by the selected Petriflow XSD.` : 'Petriflow XSD root element.';
    }

    private attributeDetail(attribute: PetriflowXsdAttribute): string {
        const type = attribute.type ? this.localName(attribute.type) : 'string';
        return `${type} · ${attribute.use === 'required' ? 'required' : 'optional'}`;
    }
}
