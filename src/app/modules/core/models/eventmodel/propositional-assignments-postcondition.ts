import { WorldValuation } from './../epistemicmodel/world-valuation';
import { Formula, FormulaFactory } from './../formula/formula';
import * as jQuery from 'jquery';
import { Postcondition } from './postcondition';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';


export class PropositionalAssignmentsPostcondition extends Postcondition {
    private post;

    constructor(post: {[prop: string]: (string | Formula)}) {
        super();
        this.post = post;

        for (let p in post) {
            if (typeof (post[p]) == "string")
                post[p] = FormulaFactory.createFormula(<string> post[p]);
        }
    }

    
    /**
    @param M an epistemic modelCheck
    @param w an id of a possible world
    @returns a world object that is the update of the world of id w by the postcondition
    */
    perform(M: ExplicitEpistemicModel, w: string) {
        var newWorld = Postcondition.cloneWorld(M.getNode(w));
        for (let p in this.post)
            newWorld.valuation.propositions[p] = M.modelCheck(w, this.post[p]);

        return newWorld;
    }






    toString() {
        let s = "";
        for (let p in this.post)
            s += p + ":=" + this.post[p] + " ";
        return s;
    }
}

