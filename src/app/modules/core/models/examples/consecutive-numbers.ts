import { FormulaFactory } from './../formula/formula';
import { ExplicitEventModel } from './../eventmodel/explicit-event-model';
import { EventModelAction } from './../environment/event-model-action';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { environment } from 'src/environments/environment';

import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';



/**
 * @param truePropositions an array of true propositions
 * @returns a state where two agents have consecutive numbers
 * @example new ConsecutiveNumbers(["a3", "b4"])
 * */
class ConsecutiveNumbersWorld extends WorldValuation {
    static get consequenceNumbersImax() { return 10; }

    constructor(propositions) {
        super(new Valuation(propositions));
        this.agentPos["a"] = { x: 24, y: 24, r: 24 };
        this.agentPos["b"] = { x: 128 - 24, y: 24, r: 24 };
        this.agentPos["c"] = undefined;
    }

    draw(context) {
        this.drawAgents(context);
        for (let a of environment.agents)
            for (var i = 1; i <= ConsecutiveNumbersWorld.consequenceNumbersImax; i++)
                if (this.modelCheck(a + i))
                    ConsecutiveNumbersWorld.drawCard(context, { x: this.agentPos[a].x, y: 48, w: 16, text: i });

    }
}



export class ConsecutiveNumbers extends ExampleDescription {
    getAtomicPropositions(): string[] {
       let A = [];
       for (let i = 1; i <= ConsecutiveNumbersWorld.consequenceNumbersImax; i++) {
           A.push("a" + i);
           A.push("b" + i);
       }
       return A;
    }
    
    getName() {
        return "Consecutive Numbers";
    }

    getInitialEpistemicModel(): EpistemicModel {
        let M = new ExplicitEpistemicModel();

        for (let ia = 1; ia <= ConsecutiveNumbersWorld.consequenceNumbersImax; ia++)
            for (let ib = ia - 1; ib <= ia + 1; ib += 2)
                if (ib >= 1)
                    M.addWorld("w" + ia + ib, new ConsecutiveNumbersWorld(["a" + ia, "b" + ib]));


        for (let i = 1; i <= ConsecutiveNumbersWorld.consequenceNumbersImax; i++)
            if ((1 <= i - 1) && (i + 1) <= ConsecutiveNumbersWorld.consequenceNumbersImax) {
                let iplus1 = (i + 1).toString();
                let imoins1 = (i - 1).toString();
                M.addEdge("a", "w" + i + imoins1, "w" + i + iplus1);
                M.addEdge("a", "w" + i + iplus1, "w" + i + imoins1);
                M.addEdge("b", "w" + iplus1 + i, "w" + imoins1 + i);
                M.addEdge("b", "w" + imoins1 + i, "w" + iplus1 + i);
            }


        M.makeReflexiveRelation("a");
        M.makeReflexiveRelation("b");

        M.setPointedWorld("w34");
        M.removeUnReachablePartFrom("w34");

        return M;
    }

    getActions() {
        function getConsequenceNumberFormulaAgentKnowOtherNumber(agent) {
            var other = (agent == "a") ? "b" : "a";

            var s = "(";

            s += "(K " + agent + " " + other + 1 + ")";

            for (var i = 2; i <= ConsecutiveNumbersWorld.consequenceNumbersImax; i++)
                s += " or " + "(K " + agent + " " + other + i + ")";

            s += ")";

            return s;
        }

        function getPronom(a) {
            return (a == "a") ? "she" : "he";
        }
        return [{ a: "a", b: "b" }, { a: "b", b: "a" }].map(
            function (obj) {
                return new EventModelAction({
                    name: "Agent " + obj.a + " announces that " + getPronom(obj.a) +
                        " knows the number of agent " + obj.b + ".",
                    eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula(getConsequenceNumberFormulaAgentKnowOtherNumber(obj.a)))
                });
            }
        ).concat(
            [{ a: "a", b: "b" }, { a: "b", b: "a" }].map(
                function (obj) {
                    return new EventModelAction({
                        name: "Agent " + obj.a + " announces that " + getPronom(obj.a) +
                            " does not know the number of agent " + obj.b + ".",
                        eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula("(not " + getConsequenceNumberFormulaAgentKnowOtherNumber(obj.a) + ")"))
                    });
                })
        );

    }

}
