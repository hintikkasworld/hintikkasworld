import { Formula, FormulaFactory } from './../formula/formula';
import * as jQuery from 'jquery';


export class PropositionalAssignmentsPostcondition {
    private post;

    constructor(post) {
        this.post = post;

        for (let p in post) {
            if (typeof (post[p]) == "string")
                post[p] = FormulaFactory.createformula(post[p]);
        }
    }

    /**
    @param M an epistemic modelCheck
    @param w an id of a possible world
    @returns a world object that is the update of the world of id w by the postcondition
    */
    perform(M, w) {
        function clone(e) {
            if (e instanceof Function)
                return e;
            if (e instanceof Array) {
                var c = new Array();

                for (let i in e) {
                    c[i] = clone(e[i]);
                }

                return c;
            }
            else
                if (e instanceof Object) {
                    let c = $.extend(true, Object.create(Object.getPrototypeOf(e)), e);;
                    return c;
                }
                else
                    return e;
        }

        var newWorld = clone(M.nodes[w]);
        for (let p in this.post)
            newWorld.propositions[p] = M.modelCheck(w, this.post[p]);

        return newWorld;
    }






    toString() {
        let s = "";
        for (let p in this.post)
            s += p + ":=" + this.post[p] + " ";
        return s;
    }
}

