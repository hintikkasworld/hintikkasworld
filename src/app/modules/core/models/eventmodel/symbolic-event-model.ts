import { EventModel } from './event-model';
import { SymbolicEvent } from './symbolic-event';
import { SymbolicEpistemicModelBDD } from '../epistemicmodel/symbolic-epistemic-model-bdd';
import { BDDNode } from '../../../../services/bdd.service';
import { BDDWorkerService } from 'src/app/services/bddworker.service';

type EventId = string;
type AgentId = string;

export class SymbolicEventModel implements EventModel<SymbolicEpistemicModelBDD> {
    /**
     * Construct SymbolicEventModel
     * @param agents list of agent as strings
     * @param variables list of variables as strings
     */
    constructor(
        agents: AgentId[],
        variables: string[],
        events: Map<EventId, SymbolicEvent<BDDNode>>,
        agentRelations: Map<AgentId, BDDNode>,
        pointedEvent: EventId
    ) {
        this.agents = agents;
        this.variables = variables;

        this.uniqueEvents = events;
        this.agentRelations = agentRelations;
        this.pointed = pointedEvent;
    }

    /** Effectively immutable */

    private agents: AgentId[];
    private variables: string[];
    private uniqueEvents: Map<EventId, SymbolicEvent<BDDNode>>;
    private agentRelations: Map<AgentId, BDDNode>;
    private pointed: EventId;

    /**
     * Implementation of a Symbolic Epistemic Model
     * Using Binary Decision Diagrams and the C library CUDD
     * TODO: remove dependency on BDDs, this should work with any kind of propositional language
     */

    /**
     * Return the string of variable string, posted.
     * @param varName
     */
    static getPostedVarName(varName: string): string {
        return SymbolicEventModel.getPostedString() + varName;
    }

    /**
     * Return the string that symbolise the Posted atom.
     */
    static getPostedString(): string {
        return '+_';
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
    static getPrimedPostedVarName(varName: string): string {
        return SymbolicEventModel.getPostedString() + varName + SymbolicEpistemicModelBDD.getPrimedString();
    }

    /**
     * Return a list of string as posted atom
     * @param vars list of atom as string
     */
    static varsToPosted(vars: string[]): Map<string, string> {
        let liste = new Map();
        for (let vari of vars) {
            liste.set(vari, SymbolicEventModel.getPostedVarName(vari));
        }
        console.log('varsToPosted', vars, liste);
        return liste;
    }

    static removePost(variable: string): string {
        return variable.replace(SymbolicEventModel.getPostedString(), '');
    }

    static removePrime(variable: string): string {
        return variable.replace(SymbolicEpistemicModelBDD.getPrimedString(), '');
    }

    static getMapPostedToNotPosted(variables: string[]): Map<string, string> {
        let map = new Map<string, string>();
        for (const vari of variables) {
            map.set(SymbolicEventModel.getPostedVarName(vari), vari);
        }
        return map;
    }

    /**
     * Method to calculate the BDDNode of the frame axiom : for all vars BigAnd[var<->+_var]
     * @param vars list of atoms.
     * @param prime if prime, add prime to calculation : BigAnd[var_p<->+_var_p]
     */
    static async frame(vars: string[], prime: boolean): Promise<BDDNode> {
        // console.log("call frame", vars, prime)

        let pointeur = await BDDWorkerService.createTrue();
        for (let vari of vars) {
            let var1 = vari;
            if (SymbolicEventModel.isPosted(vari)) {
                var1.replace('/' + SymbolicEventModel.getPostedString() + '/g', '');
            }

            let var2 = SymbolicEventModel.getPostedVarName(vari); /* .getPosted(var); */

            if (prime) {
                /* if primed : var1 = var1' , var2 = var2' */
                var1 = SymbolicEpistemicModelBDD.getPrimedVarName(vari);
                var2 = SymbolicEpistemicModelBDD.getPrimedVarName(var2);
            }

            let equiv: BDDNode = await BDDWorkerService.applyEquiv(
                await BDDWorkerService.createLiteral(var1),
                await BDDWorkerService.createLiteral(var2)
            );

            pointeur = await BDDWorkerService.applyAnd([
                await BDDWorkerService.createCopy(pointeur),
                await BDDWorkerService.createCopy(equiv)
            ]);
        }
        // console.log("end frame", vars, prime, BDD.bddService.pickSolutions(pointeur, 10));
        return pointeur;
    }

    /**
     * Apply the SymbolicEventModel (this) to the SymbolicEpistemicModelBDD
     * @param M1 SymbolicEpistemicModelBDD
     */
    apply(M: SymbolicEpistemicModelBDD): SymbolicEpistemicModelBDD {
        // TO BE REWRITTEN
        // let example = this;

        // class SEModelDescriptorFormulaEvent implements SEModelDescriptor {
        //     getAtomicPropositions(): string[] {
        //         throw new Error("Method not implemented.");
        //     }
        //     getAgents(): string[] {
        //         throw new Error("Method not implemented.");
        //     }
        //     getSetWorldsFormulaDescription(): Formula {
        //         throw new Error("Method not implemented.");
        //     }
        //     getRelationDescription(agent: string): SymbolicRelation {
        //         throw new Error("Method not implemented.");
        //     }
        //     getPointedValuation(): Valuation {
        //         throw new Error("Method not implemented.");
        //     }

        // }
        // const DEBUGLOG = (msg, n) => {};
        // //const DEBUGLOG = (msg, n) => console.log(msg, BDD.bddService.nodeToString(n), BDD.bddService.countSolutions(n) + " solutions", BDD.bddService.pickSolutions(n));

        // let agentMap = new Map<AgentId, BDDNode>();

        // console.log("APPLY", this.pointed, M.getPointedWorld().valuation, Object.keys(this.getUniqueEvent))
        // DEBUGLOG("this.pointed", this.getUniqueEvent(this.pointed).post);

        // for(let agent of this.agents){

        //     const agentEventRelation = BDDWorkerService.createCopy(this.getPlayerRelation(agent));

        //     console.log("applying to agent " + agent);

        //     /* Get the minus variables of the support */
        //     const var_minus: string[] = [];
        //     for(const vari of BDD.bddService.support(agentEventRelation))
        //         var_minus.push(SymbolicEventModel.removePost(vari));

        //     /* Get the posted variables */
        //     const var_plus: string[] = [];
        //     for(const vari of var_minus)
        //         var_plus.push(SymbolicEventModel.getPostedVarName(vari));

        //     /* transition var_plus to var_minus */
        //     // [var <= +_var, var_p <= +_var_p]
        //     let transfert = new Map<string, string>();
        //     for (var i=0; i < var_plus.length; i++)
        //         transfert.set(var_plus[i], var_minus[i]);

        //     DEBUGLOG("bdd relation for current agent", agentEventRelation);

        //     console.log("support", BDD.bddService.support(agentEventRelation));
        //     console.log("var_minus", var_minus)
        //     console.log("var_plus", var_plus)
        //     console.log("transfert", transfert)

        //     // Forget(bdd_event AND bdd_agent, var U var_p)[var <= +_var, var_p <= +_var_p]
        //     // Renaming(forget(And(event, bdd_agent), var_minus), transfert)

        //     const agentMRelation: BDDNode = BDD.bddService.createCopy(M.getAgentSymbolicRelation(agent));
        //     const keptCompatibleArcs = BDD.bddService.applyAnd([agentMRelation, agentEventRelation]);
        //     DEBUGLOG("kept arrows that are compatible", keptCompatibleArcs)
        //     const appliedPost = BDD.bddService.applyExistentialForget(keptCompatibleArcs, var_minus);
        //     DEBUGLOG("forgot 'before' vars, i.e., performed postcondition", appliedPost);
        //     const newAgentRelation = BDD.bddService.applyRenaming(appliedPost, transfert);
        //     DEBUGLOG("renamed, to get normal arrows, without '+'", newAgentRelation);

        //     agentMap.set(agent, newAgentRelation);
        // }

        // /* Find the new true world */
        // const bdd_valuation = BDD.buildFromFormula(SymbolicEpistemicModelBDD.valuationToFormula(M.getPointedWorld().valuation));
        // DEBUGLOG("pointed world bdd", bdd_valuation);
        // const bdd_pointed_framed_post: BDDNode = this.getPointedAction().post;
        // DEBUGLOG("postcond bdd on pointed event", bdd_pointed_framed_post);
        // const w = BDD.bddService.applyAnd([bdd_valuation, BDD.bddService.createCopy(bdd_pointed_framed_post)]);
        // DEBUGLOG("and new world", w)

        // if(BDD.bddService.isFalse(w)) throw new Error("An error has occured in the application of SymbolicEventModel on SymbolicEpistemicModelBDD. Are sure that event '" +
        //     this.pointed + "' can be apply on valuation " + M.getPointedWorld().valuation);

        // let res = BDD.bddService.applyExistentialForget(w, M.getPropositionalAtoms().concat(M.getPropositionalPrimes()));  //  Projection on + variables
        // DEBUGLOG("forget new world", res)
        // let listTransfert = []
        // for(let vari of M.getPropositionalAtoms())
        //     listTransfert.push(vari)
        // // console.log("LISTES", listTransfert, SymbolicEventModel.getMapPostedToNotPosted(listTransfert))
        // res = BDD.bddService.applyRenaming(res, SymbolicEventModel.getMapPostedToNotPosted(listTransfert));  // Renaming + var into normal variables
        // DEBUGLOG("renamed new world", res)
        // //let newSEM = new SymbolicEpistemicModelBDD(M.getWorldClass(), M.getAgents(), M.getPropositionalAtoms(), M.getPropositionalPrimes(), M.getInitialFormula(), BDD.bddService.toValuation(res));
        // let newSEM = new SymbolicEpistemicModelBDD(M.getWorldClass(), new SEModelDescriptorFormulaEvent());

        // /* DEBUG LOOP */
        // {
        //   console.log("example new sucessors")
        //   for(let agent of M.getAgents()){
        //       console.log("successors", agent, newSEM.getAgentSymbolicRelation(agent))
        //       DEBUGLOG("successors of " + agent,
        //       BDD.bddService.applyRenaming(
        //           BDD.bddService.applyExistentialForget(
        //               BDD.bddService.applyAnd(
        //                   [BDD.bddService.createCopy(newSEM.getAgentSymbolicRelation(agent)), BDD.bddService.createCopy(BDD.bddService.createCube(SymbolicEpistemicModelBDD.valuationToMap((<WorldValuation>newSEM.getPointedWorld()).valuation)))]),
        //               newSEM.getPropositionalAtoms()),
        //           SymbolicEpistemicModelBDD.getMapPrimeToNotPrime(newSEM.getPropositionalAtoms()))
        //       )
        //   }
        // }

        return undefined;
    }

    copyWithAnotherPointedEvent(e: EventId): SymbolicEventModel {
        return new SymbolicEventModel(this.agents, this.variables, this.uniqueEvents, this.agentRelations, e);
    }

    /**
     * Return the pointed action
     */
    getPointedAction(): SymbolicEvent<BDDNode> {
        return this.getUniqueEvent(this.pointed);
    }

    async isApplicableIn(M: SymbolicEpistemicModelBDD): Promise<boolean> {
        return await M.check(this.getPointedAction().pre);
    }

    /**
     * Return the event associated to the given string
     * @param key
     */
    getUniqueEvent(key: EventId): SymbolicEvent<BDDNode> {
        return this.uniqueEvents.get(key);
    }

    getUniqueEvents(): Map<string, SymbolicEvent<BDDNode>> {
        return this.uniqueEvents;
    }

    /**
     * Return the Player relation, i.e., its vision of the event model
     * @param agent the name of the agent
     */
    getPlayerRelation(agent: AgentId): BDDNode {
        // console.log("getPlayerEvent", agent)
        //         console.log("agentRelations", this.agentRelations, this.agentRelations.keys())
        //         console.log("uniqueEvents", this.uniqueEvents, this.uniqueEvents.keys())
        return this.agentRelations.get(agent);
    }

    getPlayerRelations(): Map<AgentId, BDDNode> {
        return this.agentRelations;
    }
}
