import { EventModel } from "./event-model";
import { EpistemicModel } from "../epistemicmodel/epistemic-model";
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { BDD } from '../formula/bdd';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { BddService, BDDNode } from '../../../../services/bdd.service';


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

    static varsToPosted(vars: string[]): Map<string, string>{
        let liste = new Map();
        for(let vari in vars){
            liste[vari] = SymbolicEventModel.getPostedVarName(vari);
        }
        return liste;
    }

    private agents: string[];
    private variables: string[];
    private uniqueEvents: Map<string, BDDNode>;
    private agentsEvents: Map<string, Map<string, BDDNode>>;
    private pointed: string;

    constructor(agents: string[], variables: string[]) {
        this.agents = agents;
        this.variables = variables;

        this.uniqueEvents = new Map<string, BDDNode>();
        this.agentsEvents = new Map<string, Map<string, BDDNode>>();

        console.log("AGENTS", agents);
        for(let agent of agents){
            this.agentsEvents[agent] = new Map<string, BDDNode>();
            console.log("Create maps", agent, this.agentsEvents[agent]);
        }
        console.log("Maps", this.agentsEvents);

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

        var bdd_single_event: BDDNode = this.getPointedActionBDD();
        
        let agentMap = new Map<string, BDD>();

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
            
            agentMap[agent] = pointeur
            // M.setAgentGraphe(agent, pointeur);
        }
        /* Find the new true world */

        var bdd_valuation = BDD.buildFromFormula(SymbolicEpistemicModel.valuationToFormula(M.getPointedWorld().valuation));
        var w = BDD.bddService.applyAnd([bdd_valuation, BDD.bddService.createCopy(bdd_single_event)]);

        if(BDD.bddService.isFalse(w)){
            throw new Error("An error has occured in the application of SymbolicEventModel on SymbolicEpistemicModel.");
        }

        let transfert2 = {};
        let plus = [];
        for(var vari in this.variables){
            plus.push(SymbolicEventModel.getPostedVarName(vari));
            transfert2[SymbolicEventModel.getPostedVarName(vari)] = vari;
        }
        
        let res = null;
        // BDD.bddService.applyExistentialForget(BDD.bddService.let(transfert2, w), plus)  //  Oublie des Post
        
        let newSEM = new SymbolicEpistemicModel(agentMap, M.getWorldClass(), M.getAgents(), M.getPropositionalAtoms(), M.getPropositionalPrimes(), M.getInitialFormula())
        newSEM.setPointedWorld(BDD.bddService.toValuation(res));
        return newSEM;
    };

    setPointedAction(e: string): void {
        this.pointed = e;
    }

    getPointedAction(): string {
        return this.pointed;
    }

    getPointedActionBDD(): BDDNode {
        let action: string = this.getPointedAction();
        return this.getUniqueEvent(action);
    }

    addUniqueEvent(key, event){
        this.uniqueEvents[key] = event;
    }

    getUniqueEvent(key: string): BDDNode{
        return this.uniqueEvents[key];
    }

    addPlayerEvent(key, agent, event){
        this.agentsEvents[agent][key] = event;
    }

    getPlayerEvent(key, agent){
        return this.agentsEvents[agent][key];
    }    
}
