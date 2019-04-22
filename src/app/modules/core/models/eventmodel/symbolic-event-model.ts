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
        
        /* Get the minus variables */
		const var_minus: string[] = M.getPropositionalAtoms().concat(M.getPropositionalPrimes());
		
		/* Get the posted variables */
		const var_plus: string[] = [];
		for(const vari of var_minus){
			var_plus.push(SymbolicEventModel.getPostedVarName(vari));
		}
		
		/* transition var_plus to var_minus */
		let transfert = new Map<string, string>();
		for (var i=0; i < var_plus.length; i++){
			transfert.set(var_plus[i], var_minus[i]);
		}
        
        

        for(let agent of this.agents){
            console.log("applying to agent " + agent);
            
            // TODO manage preconditions that are not propositional
            
            // TODO why do we only apply this on the pointed event??
            const ev_for_agent = this.getPlayerEvent(this.pointed, agent);
            DEBUGLOG("bdd event for current agent", ev_for_agent);
            
            let support: string[] = BDD.bddService.support(ev_for_agent);

           

            console.log("support", support)
            console.log("var_minus", var_minus)
            console.log("var_plus", var_plus)
            console.log("transfert", transfert)

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
            this.getPointedAction() + "' can be apply on valuation " + M.getPointedWorld().valuation);
        
        let res = BDD.bddService.applyExistentialForget(w, var_minus);  //  Projection on + variables
        DEBUGLOG("forget new world", res)
        res = BDD.bddService.applyRenaming(res, transfert);  // Renaming to get normal variables
        DEBUGLOG("renamed new world", res)
        let newSEM = new SymbolicEpistemicModel(agentMap, M.getWorldClass(), M.getAgents(), M.getPropositionalAtoms(), M.getPropositionalPrimes(), M.getInitialFormula())
        newSEM.setPointedValuation(BDD.bddService.toValuation(res));
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
}
