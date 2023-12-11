import { is } from 'bpmn-js/lib/util/ModelUtil';

export default class CustomContextPadProvider {

    private create: any;
    private elementFactory: any;
    private translate: any;
    private eventBus: any;

    constructor(contextPad, create, elementFactory, translate, eventBus) {
        this.create = create;
        this.elementFactory = elementFactory;
        this.translate = translate;
        this.eventBus = eventBus; // Assign eventBus

        contextPad.registerProvider(this);
    }

    getContextPadEntries(element) {
        const actions = {}
        if(is(element, 'bpmn:IntermediateThrowEvent') || is(element, 'bpmn:IntermediateCatchEvent')) {
            actions['openActins.action'] = {
                group: 'netgrif',
                className: 'bpmn-icon-script',
                title: this.translate('Edit actions'),
                action: {
                    click: (event) => {
                        // Fire an event when the bpmn:userTask element is clicked
                        this.eventBus.fire('open.actionBuilder', { event, element });
                    }
                }
            };
            return actions;
        }
        if (is(element, 'bpmn:Task')) {
            actions['openActins.action'] = {
                group: 'netgrif',
                className: 'bpmn-icon-script',
                title: this.translate('Edit actions'),
                action: {
                    click: (event) => {
                        // Fire an event when the bpmn:userTask element is clicked
                        this.eventBus.fire('open.actionBuilder', { event, element });
                    }
                }
            };
            actions['openForms.action'] = {
                group: 'netgrif',
                className: 'bpmn-icon-business-rule',
                title: this.translate('Edit form'),
                action: {
                    click: (event) => {
                        // Fire an event when the bpmn:userTask element is clicked
                        this.eventBus.fire('open.formBuilder', { event, element });
                    }
                }
            };
        }
        // if (is(element, 'bpmn:UserTask')) {
        //     actions['openActins.action'] = {
        //         group: 'netgrif',
        //         className: 'bpmn-icon-script',
        //         title: this.translate('Edit actions'),
        //         action: {
        //             click: (event) => {
        //                 // Fire an event when the bpmn:userTask element is clicked
        //                 this.eventBus.fire('open.actionBuilder', { event, element });
        //             }
        //         }
        //     };
        //     actions['openForms.action'] = {
        //         group: 'netgrif',
        //         className: 'bpmn-icon-business-rule',
        //         title: this.translate('Edit form'),
        //         action: {
        //             click: (event) => {
        //                 // Fire an event when the bpmn:userTask element is clicked
        //                 this.eventBus.fire('open.formBuilder', { event, element });
        //             }
        //         }
        //     };
        // }
        // if (is(element, 'bpmn:ServiceTask')) {
        //     actions['openForms.action'] = {
        //         group: 'netgrif',
        //         className: 'bpmn-icon-script',
        //         title: this.translate('Edit actions'),
        //         action: {
        //             click: (event) => {
        //                 // Fire an event when the bpmn:userTask element is clicked
        //                 this.eventBus.fire('open.actionBuilder', { event, element });
        //             }
        //         }
        //     };
        // }

        return actions;
    }
}
