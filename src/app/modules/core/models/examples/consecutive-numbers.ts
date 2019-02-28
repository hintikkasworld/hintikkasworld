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
                    this.drawCard(context, { x: this.agentPos[a].x, y: 48, w: 16, text: i });

    }
}



export class ConsecutiveNumbers extends ExampleDescription {
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
        return [];
    }

}
