import inherits from 'inherits';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default function CustomRulesProvider(eventBus) {
    RuleProvider.call(this, eventBus);
}

inherits(CustomRulesProvider, RuleProvider);

CustomRulesProvider.$inject = ['eventBus'];

CustomRulesProvider.prototype.init = function() {
    this.addRule('connection.create', function(context) {
        var source = context.source,
            target = context.target;

        //custom rules definitions
        if (source.type === 'bpmn:StartEvent' && target.type === 'bpmn:EndEvent') {
            return false;
        }

        // return true if not explicitly disallowed
        return true;
    });
};
