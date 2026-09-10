export interface ActionCompletionTitle {
    value?: string;
}

export interface ActionCompletionDataField {
    id: string;
    type: string;
    title?: ActionCompletionTitle;
}

export interface ActionCompletionTransition {
    id: string;
    label?: ActionCompletionTitle;
}

export interface ActionCompletionModel {
    getDataSet(): ReadonlyArray<ActionCompletionDataField>;
    getTransitions(): ReadonlyArray<ActionCompletionTransition>;
}
