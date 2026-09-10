import {PetriflowXsdSchema} from './petriflow-xsd-schema';

describe('PetriflowXsdSchema', () => {
    const schema = `
        <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
            <xs:simpleType name="eventType">
                <xs:restriction base="xs:string">
                    <xs:enumeration value="assign"/>
                    <xs:enumeration value="finish"/>
                </xs:restriction>
            </xs:simpleType>
            <xs:simpleType name="dataEventType">
                <xs:restriction base="xs:string">
                    <xs:enumeration value="set"/>
                    <xs:enumeration value="get"/>
                </xs:restriction>
            </xs:simpleType>
            <xs:complexType name="baseEvent">
                <xs:sequence>
                    <xs:element name="id" type="xs:string"/>
                </xs:sequence>
            </xs:complexType>
            <xs:complexType name="event">
                <xs:complexContent>
                    <xs:extension base="baseEvent">
                        <xs:sequence>
                            <xs:element name="title" type="xs:string"/>
                        </xs:sequence>
                        <xs:attribute name="type" type="eventType" use="required"/>
                    </xs:extension>
                </xs:complexContent>
            </xs:complexType>
            <xs:complexType name="dataEvent">
                <xs:complexContent>
                    <xs:extension base="baseEvent">
                        <xs:attribute name="type" type="dataEventType" use="required"/>
                    </xs:extension>
                </xs:complexContent>
            </xs:complexType>
            <xs:complexType name="transition">
                <xs:sequence>
                    <xs:element name="event" type="event"/>
                </xs:sequence>
            </xs:complexType>
            <xs:complexType name="data">
                <xs:sequence>
                    <xs:element name="event" type="dataEvent"/>
                </xs:sequence>
            </xs:complexType>
            <xs:complexType name="place">
                <xs:sequence>
                    <xs:element name="id" type="xs:string"/>
                    <xs:element name="x" type="xs:integer"/>
                    <xs:element name="y" type="xs:integer"/>
                    <xs:element name="label" type="xs:string"/>
                    <xs:element name="tokens" type="xs:integer"/>
                    <xs:element name="static" type="xs:boolean"/>
                </xs:sequence>
            </xs:complexType>
            <xs:complexType name="documentType">
                <xs:sequence>
                    <xs:element name="transition" type="transition"/>
                    <xs:element name="data" type="data"/>
                    <xs:element name="place" type="place"/>
                </xs:sequence>
            </xs:complexType>
            <xs:element name="document" type="documentType"/>
        </xs:schema>
    `;

    it('resolves values from the event type selected by its XML path', () => {
        const xsd = new PetriflowXsdSchema(schema);

        const transitionType = xsd.getAttributes(['document', 'transition', 'event'])?.find(attribute => attribute.name === 'type');
        const dataType = xsd.getAttributes(['document', 'data', 'event'])?.find(attribute => attribute.name === 'type');

        expect(transitionType?.values).toEqual(['assign', 'finish']);
        expect(dataType?.values).toEqual(['set', 'get']);
    });

    it('includes elements inherited through an XSD extension', () => {
        const xsd = new PetriflowXsdSchema(schema);

        const elements = xsd.getSubElements(['document', 'transition', 'event'])?.map(element => element.name);

        expect(elements).toEqual(['id', 'title']);
    });

    it('offers only the next elements allowed by an XSD sequence', () => {
        const xsd = new PetriflowXsdSchema(schema);

        const beforeId = xsd.getExpectedSubElements(['document', 'transition', 'event'], [])?.map(element => element.name);
        const afterId = xsd.getExpectedSubElements(['document', 'transition', 'event'], ['id'])?.map(element => element.name);

        expect(beforeId).toEqual(['id']);
        expect(afterId).toEqual(['title']);
    });

    it('offers label after the coordinates of a place', () => {
        const xsd = new PetriflowXsdSchema(schema);

        const elements = xsd.getExpectedSubElements(
            ['document', 'place'],
            ['id', 'x', 'y'],
        )?.map(element => element.name);

        expect(elements).toEqual(['label']);
    });
});
