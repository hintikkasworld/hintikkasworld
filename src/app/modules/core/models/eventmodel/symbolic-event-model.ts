import { EventModel } from "./event-model";
import { EpistemicModel } from "../epistemicmodel/epistemic-model";
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { TrivialPostcondition } from './trivial-postcondition';
import { Formula } from '../formula/formula';
import { Postcondition } from './postcondition';
import { environment } from 'src/environments/environment';
import { Graph } from './../graph';

export class SymbolicEventModel implements EventModel  {

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

    static isPosted(str: string){
        return str.includes(SymbolicEventModel.getPostedString());
    }

    static getPrimedPostedVarName(varName:string){
        return varName + SymbolicEventModel.getPostedString() + SymbolicEpistemicModel.getPrimedString();
    }

    static varsToPosted(vars: string[]){
        let liste = {};
        for(let vari in vars){
            liste[vari] = SymbolicEventModel.getPostedVarName(vari);
        }
        return liste;
    }



    private agents: [string];
    private variables: [string];
    private uniqueEvents: {};
    private agentsEvents: {};
    private pointed: string;

    constructor(agents: [string], variables: [string]) {
        this.agents = agents;
        this.variables = variables;

        this.uniqueEvents = {}
        this.agentsEvents = {}
        for(let agent in agents){
            this.agentsEvents[agent] = {};
        }

    }

    apply(M: EpistemicModel): EpistemicModel{
        return null;
    };

    setPointedAction(e: string): void {
        this.pointed = e;
    }

    getPointedAction(): string{
        return this.pointed;
    }

    addUniqueEvent(key, event){
        this.uniqueEvents[key] = event;
    }

    addPlayerEvent(key, agent, event){
        this.uniqueEvents[agent][key] = event;
    }

    
}
