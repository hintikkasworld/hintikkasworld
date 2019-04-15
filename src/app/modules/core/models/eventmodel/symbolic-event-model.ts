import { EventModel } from "./event-model";
import { EpistemicModel } from "../epistemicmodel/epistemic-model";
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { TrivialPostcondition } from './trivial-postcondition';
import { Formula } from '../formula/formula';
import { Postcondition } from './postcondition';
import { environment } from 'src/environments/environment';


export class SymbolicEventModel implements EventModel {

     /**
     * Implementation d'un Modele Epistemique Symbolique
     * Ici via des BDD, et Cudd
     */

     /*********
      * STATIC
      *********/
     
    /**
     * Retourne la nom d'une variable en le nom prime
     * @param varName
     */
    static getPostedVarName(varName:string){
        return varName + SymbolicEventModel.getPostedString();
    }

    static getPostedString(){
        return "_+"
    }

    static getPrimedPostedVarName(varName:string){
        return varName + SymbolicEventModel.getPostedString() + SymbolicEpistemicModel.getPrimedString();
    }

    apply(M: EpistemicModel): EpistemicModel{
        return null;
    };

    static getEventModelPublicAnnouncement(formula: Formula){

        let E = new SymbolicEventModel();
        E.addAction("e", formula, new TrivialPostcondition());

        for (let a of environment.agents)
            E.addEdge(a, "e", "e");

        E.setPointedAction("e");

        return E;
    }

    addAction(e: string, pre: Formula, post: Postcondition = new TrivialPostcondition()) {
        this.addNode(e, {
            pre: pre,
            post: post,
            getShortDescription: function () {
                if (post.toString() == "idle")
                    return "pre: " + this.pre.prettyPrint();
                else
                    return "pre: " + this.pre.prettyPrint() + "; post: " + post.toString()
            }
            // toHTML: function() {return ' <table><tr><td>pre: </td><td>' + formulaPrettyPrint(this.pre) + '</td></tr><tr><td>post: </td><td>' + post.toString() + '</td></tr></table>'}
        });
    }

}
