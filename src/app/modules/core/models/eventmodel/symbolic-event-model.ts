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
     * Return the string of variable string, posted.
     * @param varName
     */
    static getPostedVarName(varName:string): string {
        return SymbolicEventModel.getPostedString() + varName ;
    }
    
    /**
     * Return the string that symbolise the Posted atom.
     */
    static getPostedString(): string {
        return "+_"
    }

    /**
     * Check if atom str is a posted variable
     * @param str variable
     */
    static isPosted(str: string): boolean {
        return str.includes(SymbolicEventModel.getPostedString());
    }

    /**
     * Return the variable varName as Posted and Primed
     * @param varName variable
     */
    static getPrimedPostedVarName(varName:string): string {
        return SymbolicEventModel.getPostedString() + varName + SymbolicEpistemicModel.getPrimedString();
    }

    /**
     * Return a list of string as posted atom
     * @param vars list of atom as string
     */
    static varsToPosted(vars: string[]): Map<string, string>{
    
        let liste = new Map();
        for(let vari of vars){
            liste.set(vari, SymbolicEventModel.getPostedVarName(vari));
        }
        console.log("varsToPosted", vars, liste)
        return liste;
    }

    private agents: string[];
    private variables: string[];
    private uniqueEvents: Map<string, BDDNode>;
    private agentsEvents: Map<string, Map<string, BDDNode>>;
    private pointed: string;

    /**
     * Construct SymbolicEventModel
     * @param agents list of agent as strings
     * @param variables list of variables as strings
     */
    constructor(agents: string[], variables: string[]) {
        this.agents = agents;
        this.variables = variables;

        this.uniqueEvents = new Map<string, BDDNode>();
        this.agentsEvents = new Map<string, Map<string, BDDNode>>();

        console.log("AGENTS", agents);
        for(let agent of agents){
            this.agentsEvents.set(agent, new Map<string, BDDNode>());
        }
        console.log("Maps", this.agentsEvents);

    }

    /**
     * Apply the SymbolicEventModel (this) to the SymbolicEpistemicModel
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
        
        let agentMap = new Map<string, BDDNode>();

        // console.log("APPLY", this.pointed, M1.getPointedWorld().valuation)

        for(let agent of this.agents){

            var ev_for_agent = this.getPlayerEvent(this.pointed, agent);

            // console.log("ev_for_agent", BDD.bddService.pickAllSolutions(ev_for_agent));
            
            let support: string[] = BDD.bddService.support(ev_for_agent);

            /* Get the minus variables */
            var var_minus: string[] = M.getPropositionalAtoms().concat(M.getPropositionalPrimes());
            
            /* Get the posted variables */
            var var_plus: string[] = [];
            for(var vari of var_minus){
                var_plus.push(SymbolicEventModel.getPostedVarName(vari));
            }
            
            /* transistion var_plus to var_minus */
            var transfert = new Map<string, string>();
            for(var i=0; i<var_plus.length; i++){
                transfert.set(var_plus[i], var_minus[i]);
            }

            /*
            console.log("ev_for_agent", ev_for_agent)
            console.log("support", support)
            console.log("var_minus", var_minus)
            console.log("var_plus", var_plus)
            console.log("transfert", transfert)
            */

            var pointeur: BDDNode = M.getAgentSymbolicRelation(agent);
            pointeur = BDD.bddService.applyAnd([BDD.bddService.createCopy(pointeur), BDD.bddService.createCopy(ev_for_agent)]);
            // console.log("1", BDD.bddService.pickAllSolutions(pointeur))
            pointeur = BDD.bddService.applyExistentialForget(BDD.bddService.createCopy(pointeur), var_minus);
            // console.log("2", BDD.bddService.pickAllSolutions(pointeur))
            pointeur = BDD.bddService.applyRenaming(BDD.bddService.createCopy(pointeur), transfert); 
            // console.log("3", BDD.bddService.pickAllSolutions(pointeur))

            let ci = 0;
            for(let val of BDD.bddService.pickAllSolutions(pointeur)){
                // console.log("val", val.toString())
                if(ci>10) break
                ci++
            }
            
            agentMap.set(agent, pointeur);
            
        }
        /* Find the new true world */

        var bdd_valuation = BDD.buildFromFormula(SymbolicEpistemicModel.valuationToFormula(M.getPointedWorld().valuation));
        var w = BDD.bddService.applyAnd([bdd_valuation, BDD.bddService.createCopy(bdd_single_event)]);
        // console.log("and new world", BDD.bddService.pickAllSolutions(w))

        if(BDD.bddService.isFalse(w)) throw new Error("An error has occured in the application of SymbolicEventModel on SymbolicEpistemicModel. Are sure that event '" + this.getPointedAction() + "' can be apply on valuation " + M1.getPointedWorld().valuation);
        
        let transfert2: Map<string, string> = new Map<string, string>();
        let plus: string[] = [];
        for(var vari of BDD.bddService.support(w)){
            if(SymbolicEventModel.isPosted(vari)){
                plus.push(SymbolicEventModel.getPostedVarName(vari));
                transfert2.set(SymbolicEventModel.getPostedVarName(vari), vari);
            }
        }
        
        let res = BDD.bddService.applyExistentialForget(BDD.bddService.applyRenaming(w, transfert2), plus)  //  Oublie des Post
        // console.log("forget new world", BDD.bddService.pickAllSolutions(res))
        let newSEM = new SymbolicEpistemicModel(agentMap, M.getWorldClass(), M.getAgents(), M.getPropositionalAtoms(), M.getPropositionalPrimes(), M.getInitialFormula())
        newSEM.setPointedValuation(BDD.bddService.toValuation(res));
        return newSEM;
    };

    /**
     * Set the pointed action
     * @param e the event name
     */
    setPointedAction(e: string): void {
        this.pointed = e;
    }

    /**
     * Return the pointed action, as string
     */
    getPointedAction(): string {
        return this.pointed;
    }

    /**
     * Return the pointed action, as BDDNode
     */
    getPointedActionBDD(): BDDNode {
        let action: string = this.getPointedAction();
        return this.getUniqueEvent(action);
    }

    /**
     * Add an Unique Event
     * @param key name of the event
     * @param event BDDNode of the event
     */
    addUniqueEvent(key: string, event: BDDNode): void {
        this.uniqueEvents.set(key, event);
    }

    /**
     * Return the associate BDDNode of the string of event
     * @param key 
     */
    getUniqueEvent(key: string): BDDNode {
        return this.uniqueEvents.get(key);
    }

    /**
     * Add the Player event, vision of the event string:'key'|BDDNode:'event' by the player 'agent'
     * @param key the name of the event
     * @param agent the name of the agent
     * @param event the BDDNode of the event
     */
    addPlayerEvent(key: string, agent: string, event: BDDNode): void {
        console.log("add", key, agent, event)
        this.agentsEvents.get(agent).set(key, event);
    }

    /**
     * Return the Player event, vision of the event string:'key' by the player 'agent'
     * @param key the name of the event
     * @param agent the name of the agent
     */
    getPlayerEvent(key: string, agent: string): BDDNode {
        console.log("getPlayerEvent", key, agent)
        console.log("agentsEvents", this.agentsEvents, this.agentsEvents.keys())
        console.log("uniqueEvents", this.uniqueEvents, this.uniqueEvents.keys())
        console.log(this.agentsEvents.get(agent))
        return this.agentsEvents.get(agent).get(key);
    }    
}
