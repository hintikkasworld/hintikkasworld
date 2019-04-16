import { EventModel } from "./event-model";
import { EpistemicModel } from "../epistemicmodel/epistemic-model";
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { BDD } from '../formula/bdd';
import { WorldValuation } from '../epistemicmodel/world-valuation';

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

    private agents: string[];
    private variables: string[];
    private uniqueEvents: {};
    private agentsEvents: {};
    private pointed: string;

    constructor(agents: string[], variables: string[]) {
        this.agents = agents;
        this.variables = variables;

        this.uniqueEvents = {}
        this.agentsEvents = {}
        for(let agent in agents){
            this.agentsEvents[agent] = {};
        }

    }

    /**
     * Apply the SymbolicEventModel (this) to the SymbolicEpistemicModel
     * Caution: The parameter is changed in the method, then returned.
     * @param M1 SymbolicEpistemicModel
     */
    apply(M1: EpistemicModel): SymbolicEpistemicModel{

        /* OK but... */
        if(M1 instanceof ExplicitEpistemicModel) {
            throw new Error("Need to have an SymbolicEpistemicModel to go with SymbolicEventModel, not a ExplicitEpistemicModel");
        }

        if(!(M1 instanceof SymbolicEpistemicModel)) {
            throw new Error("Need to have an SymbolicEpistemicModel to go with SymbolicEventModel");
        }
        
        var M = <SymbolicEpistemicModel> M1;

        var bdd_single_event: BDD = this.getPointedActionBDD();

        for(var agent in this.agents){
            var ev_for_agent = this.getPlayerEvent(this.pointed, agent);
            
            let support = BDD.bddService.support(ev_for_agent);

            /* Get the minus variables */
            var var_minus = [];
            for(let variable in support){
                /* remove the _+ */
                let var1 = variable.replace("/" + SymbolicEventModel.getPostedString() +"/g",'');
                if(var1 in var_minus){
                    var_minus.slice( var_minus.indexOf(var1), 1);
                }
                var_minus.push(var1);
            }
            
            /* Get the posted variables */
            var var_plus = [];
            for(var vari in var_minus){
                var_plus.push(SymbolicEventModel.getPostedVarName(vari));
            }
            
            /* transistion var_plus to var_minus */
            var transfert = {};
            for(var i=0; i<var_plus.length; i++){
                transfert[var_plus[i]] = var_minus;
            }

            var pointeur = M.getAgentGraphe(agent);
            pointeur = BDD.and([pointeur, ev_for_agent]);
            pointeur = BDD.existentialforget(pointeur, var_minus);
            /* pointeur = BDD.let(pointeur, transfert); */

            M.setAgentGraphe(agent, pointeur);
        }
        /* Find the new true world */

        var bdd_valuation = BDD.buildFromFormula(SymbolicEpistemicModel.valuationToFormula(M.getPointedWorld().valuation)).bddNode;
        var w = BDD.bddService.createAnd([bdd_valuation, bdd_single_event.bddNode]);

        if(BDD.bddService.isFalse(w)){
            throw new Error("An error has occured in the application of SymbolicEventModel on SymbolicEpistemicModel.");
        }

        let transfert2 = {};
        let plus = [];
        for(var vari in this.variables){
            plus.push(SymbolicEventModel.getPostedVarName(vari));
            transfert2[SymbolicEventModel.getPostedVarName(vari)] = vari;
        }
        
        let res = BDD.bddService.createExistentialForget(BDD.bddService.let(transfert2, w), plus)  //  Oublie des Post
        
        M.setPointedWorld(BDD.bddService.toValuation(res));
        
        return M;
    };

    setPointedAction(e: string): void {
        this.pointed = e;
    }

    getPointedAction(): string{
        return this.pointed;
    }

    getPointedActionBDD(): BDD {
        return this.getUniqueEvent(this.getPointedAction());
    }

    addUniqueEvent(key, event){
        this.uniqueEvents[key] = event;
    }

    getUniqueEvent(key){
        return this.uniqueEvents[key];
    }

    addPlayerEvent(key, agent, event){
        this.agentsEvents[agent][key] = event;
    }

    getPlayerEvent(key, agent){
        return this.agentsEvents[agent][key];
    }    
}
