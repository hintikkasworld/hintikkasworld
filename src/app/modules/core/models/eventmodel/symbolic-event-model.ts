import { EventModel } from "./event-model";
import { SymbolicEvent } from "./symbolic-event";
import { EpistemicModel } from "../epistemicmodel/epistemic-model";
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { BDD } from '../formula/bdd';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { BddService, BDDNode } from '../../../../services/bdd.service';


type EventId = string;

export class SymbolicEventModel implements EventModel<SymbolicEpistemicModel>  {

     /**
     * Implementation d'un Modele Epistemique Symbolique
     * Ici via des BDD, et Cudd
     * TODO: remove dependency on BDDs, this should work with any kind of propositional language
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

    static removePost(variable: string): string {
        return variable.replace(SymbolicEventModel.getPostedString(),'');
    }

    static removePrime(variable: string): string {
        return variable.replace(SymbolicEpistemicModel.getPrimedString(),'');
    }

    static getMapPostedToNotPosted(variables: string[]): Map<string, string>{
        let map = new Map<string, string>();
        for(const vari of variables)
            map.set(SymbolicEventModel.getPostedVarName(vari), vari);
        return map;
    }

    private agents: string[];
    private variables: string[];
    private uniqueEvents: Map<EventId, SymbolicEvent<BDDNode>>;
    private agentsEvents: Map<string, Map<EventId, BDDNode>>;
    private pointed: EventId;

    /**
     * Construct SymbolicEventModel
     * @param agents list of agent as strings
     * @param variables list of variables as strings
     */
    constructor(agents: string[], variables: string[]) {
        this.agents = agents;
        this.variables = variables;

        this.uniqueEvents = new Map<EventId, SymbolicEvent<BDDNode>>();
        this.agentsEvents = new Map<string, Map<EventId, BDDNode>>();

        console.log("AGENTS", agents);
        for(let agent of agents){
            this.agentsEvents.set(agent, new Map<EventId, BDDNode>());
        }
        console.log("Maps", this.agentsEvents);

    }

    /**
     * Apply the SymbolicEventModel (this) to the SymbolicEpistemicModel
     * @param M1 SymbolicEpistemicModel
     */
    apply(M: SymbolicEpistemicModel): SymbolicEpistemicModel{
        //const DEBUGLOG = (msg, n) => {};
        const DEBUGLOG = (msg, n) => console.log(msg, BDD.bddService.nodeToString(n), BDD.bddService.countSolutions(n) + " solutions", BDD.bddService.pickSolutions(n));
        
        let agentMap = new Map<string, BDDNode>();

        console.log("APPLY", this.pointed, M.getPointedWorld().valuation)
        DEBUGLOG("this.pointed", this.getUniqueEvent(this.pointed).post);

        for(let agent of this.agents){

            const ev_for_agent = this.getPlayerEvent(this.pointed, agent);

            console.log("applying to agent " + agent);

            /* Get the minus variables of the support */
            const var_minus: string[] = [];
            for(const vari of BDD.bddService.support(ev_for_agent))
                var_minus.push(SymbolicEventModel.removePost(vari));
            
            /* Get the posted variables */
            const var_plus: string[] = [];
            for(const vari of var_minus)
                var_plus.push(SymbolicEventModel.getPostedVarName(vari));
            
            /* transition var_plus to var_minus */
            // [var <= +_var, var_p <= +_var_p]
            let transfert = new Map<string, string>();
            for (var i=0; i < var_plus.length; i++)
                transfert.set(var_plus[i], var_minus[i]);
            
            
            DEBUGLOG("bdd event for current agent", ev_for_agent);
            
            let support: string[] = BDD.bddService.support(ev_for_agent);

            console.log("support", support)
            console.log("var_minus", var_minus)
            console.log("var_plus", var_plus)
            console.log("transfert", transfert)

            // Forget(bdd_event AND bdd_agent, var U var_p)[var <= +_var, var_p <= +_var_p]
            // Renaming(forget(And(event, bdd_agent), var_minus), transfert)

            let pointeur: BDDNode = BDD.bddService.createCopy(M.getAgentSymbolicRelation(agent));
            pointeur = BDD.bddService.applyAnd([pointeur, BDD.bddService.createCopy(ev_for_agent)]);
            DEBUGLOG("kept arrows that are compatible", pointeur)
            pointeur = BDD.bddService.applyExistentialForget(pointeur, var_minus);
            DEBUGLOG("forgot 'before' vars, i.e., performed postcondition", pointeur);
            pointeur = BDD.bddService.applyRenaming(pointeur, transfert);
            DEBUGLOG("renamed, to get normal arrows, without '+'", pointeur);
            
            agentMap.set(agent, pointeur);

            
        }
        
        /* Find the new true world */
        const bdd_valuation = BDD.buildFromFormula(SymbolicEpistemicModel.valuationToFormula(M.getPointedWorld().valuation));
        DEBUGLOG("pointed world bdd", bdd_valuation);        
        const bdd_pointed_framed_post: BDDNode = this.getPointedAction().post;
        DEBUGLOG("postcond bdd on pointed event", bdd_pointed_framed_post);        
        const w = BDD.bddService.applyAnd([bdd_valuation, BDD.bddService.createCopy(bdd_pointed_framed_post)]);
        DEBUGLOG("and new world", w)

        if(BDD.bddService.isFalse(w)) throw new Error("An error has occured in the application of SymbolicEventModel on SymbolicEpistemicModel. Are sure that event '" +
            this.pointed + "' can be apply on valuation " + M.getPointedWorld().valuation);
        
        let res = BDD.bddService.applyExistentialForget(w, M.getPropositionalAtoms().concat(M.getPropositionalPrimes()));  //  Projection on + variables
        DEBUGLOG("forget new world", res)
        let listTransfert = []
        for(let vari of M.getPropositionalAtoms())
            listTransfert.push(vari)
        // console.log("LISTES", listTransfert, SymbolicEventModel.getMapPostedToNotPosted(listTransfert))
        res = BDD.bddService.applyRenaming(res, SymbolicEventModel.getMapPostedToNotPosted(listTransfert));  // Renaming + var into normal variables
        DEBUGLOG("renamed new world", res)
        let newSEM = new SymbolicEpistemicModel(agentMap, M.getWorldClass(), M.getAgents(), M.getPropositionalAtoms(), M.getPropositionalPrimes(), M.getInitialFormula())
        newSEM.setPointedValuation(BDD.bddService.toValuation(res));
        console.log("example new sucessors")

        for(let agent of M.getAgents()){
            console.log("successors", agent, newSEM.getAgentSymbolicRelation(agent))
            DEBUGLOG("successors of " + agent,
            BDD.bddService.applyRenaming(
                BDD.bddService.applyExistentialForget(
                    BDD.bddService.applyAnd(
                        [BDD.bddService.createCopy(newSEM.getAgentSymbolicRelation(agent)), BDD.bddService.createCopy(BDD.bddService.createCube(SymbolicEpistemicModel.valuationToMap((<WorldValuation>newSEM.getPointedWorld()).valuation)))]),
                    newSEM.getPropositionalAtoms()), 
                SymbolicEpistemicModel.getMapPrimeToNotPrime(newSEM.getPropositionalAtoms()))
            )
        }

        return newSEM;
    };

    /**
     * Set the pointed action
     * @param e the event name
     */
    setPointedAction(e: EventId): void {
        this.pointed = e;
    }

    /**
     * Return the pointed action
     */
    getPointedAction(): SymbolicEvent<BDDNode> {
        return this.getUniqueEvent(this.pointed);
    }
    
    isApplicableIn(M: SymbolicEpistemicModel): boolean {
      return M.check(this.getPointedAction().pre);
    }

    /**
     * Add an Unique Event
     * @param key name of the event
     * @param event event
     */
    addUniqueEvent(key: EventId, event: SymbolicEvent<BDDNode>): void {
        this.uniqueEvents.set(key, event);
    }

    /**
     * Return the event associated to the given string
     * @param key 
     */
    getUniqueEvent(key: EventId): SymbolicEvent<BDDNode> {
        return this.uniqueEvents.get(key);
    }

    /**
     * Add the Player event, vision of the event string:'key'|BDDNode:'event' by the player 'agent'
     * @param key the name of the event
     * @param agent the name of the agent
     * @param event the BDDNode of the event
     */
    addPlayerEvent(key: EventId, agent: string, event: BDDNode): void {
        console.log("add", key, agent, event)
        this.agentsEvents.get(agent).set(key, event);
    }

    /**
     * Return the Player event, vision of the event string:'key' by the player 'agent'
     * @param key the name of the event
     * @param agent the name of the agent
     */
    getPlayerEvent(key: EventId, agent: string): BDDNode {
        console.log("getPlayerEvent", key, agent)
        console.log("agentsEvents", this.agentsEvents, this.agentsEvents.keys())
        console.log("uniqueEvents", this.uniqueEvents, this.uniqueEvents.keys())
        console.log(this.agentsEvents.get(agent))
        return this.agentsEvents.get(agent).get(key);
    }    

    /**
     * Method to calculate the BDDNode of the frame axiom : for all vars BigAnd[var<->+_var]
     * @param vars list of atoms.
     * @param prime if prime, add prime to calculation : BigAnd[var_p<->+_var_p]
     */
    static frame(vars: string[], prime: boolean): BDDNode {
        console.log("call frame", vars, prime)

        let pointeur = BDD.bddService.createTrue();
        for (let vari of vars) {
            let var1 = vari;
            if (SymbolicEventModel.isPosted(vari)) { var1.replace("/" + SymbolicEventModel.getPostedString() + "/g", ''); }

            let var2 = SymbolicEventModel.getPostedVarName(vari); /* .getPosted(var); */

            if (prime) { /* if primed : var1 = var1' , var2 = var2' */
                var1 = SymbolicEpistemicModel.getPrimedVarName(vari);
                var2 = SymbolicEpistemicModel.getPrimedVarName(var2);
            }

            let equiv = BDD.bddService.applyEquiv(
                BDD.bddService.createLiteral(var1),
                BDD.bddService.createLiteral(var2));

            pointeur = BDD.bddService.applyAnd([BDD.bddService.createCopy(pointeur), BDD.bddService.createCopy(equiv)]);
        }
        // console.log("end frame", vars, prime, BDD.bddService.pickSolutions(pointeur, 10));
        return pointeur;
    }
}
