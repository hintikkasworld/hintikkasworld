import { Formula } from './../formula/formula';
import { ExplicitEventModel } from './explicit-event-model';
import { SymbolicEventModel } from './symbolic-event-model';
import { Event } from './event';
import { SymbolicEvent } from './symbolic-event';
import { BDD } from '../formula/bdd';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Postcondition } from './postcondition';
import { TrivialPostcondition } from './trivial-postcondition';

export type BDDNode = number;

/**
 * Allows to transform an ExplicitEventModel into a SymbolicEventModel, using the translate() method.
 */
export class ExplicitToSymbolic {

    /**
     * Translate an ExplicitEventModel into a SymbolicEventModel
     * @param E the ExplicitEventModel we want to transform
     * @param variables list of all variables which describe worlds
     * @param agents list of agents
     */

    static translate(explicit_em: ExplicitEventModel, variables: string[], agents: string[]): SymbolicEventModel{
        const BS = BDD.bddService;
        
        console.log("==================================")
        console.log("ExplicitToSymbolic.translate");

        
        const event_framed_bdds = new Map<string, BDDNode>();
        
        const events = new Map();
        for(const [eventName, ev] of <[string, Event][]>Object.entries(explicit_em.getNodes())){
            console.log(eventName, ev);
            const post_bdd = ExplicitToSymbolic._event_to_bdd(ev.pre, ev.post)
            
            /* === computation of the frame === */
            /* Keep the precondition variables */
            const support = BS.support(post_bdd)
            console.log("support", support)
            const liste = variables.filter(v => !(support.includes(v) || support.includes(SymbolicEventModel.getPostedVarName(v))));
                /* TODO check this, I thought we had something better at some point */
            console.log("variables to frame", liste);
            const frame = ExplicitToSymbolic._frame(liste, false);
            console.log("frame:", BS.nodeToString(frame), BS.pickSolutions(frame, 10));
            console.log("supp of frame", BS.support(frame));
            const framed_bdd = BS.applyAnd([BS.createCopy(post_bdd), frame]);
            console.log("framed BDD:", BS.nodeToString(framed_bdd), BS.pickSolutions(framed_bdd, 10));
            event_framed_bdds.set(eventName, framed_bdd);
            
            
            const symEvent = new SymbolicEvent(ev.pre, framed_bdd, eventName);            
            //console.log(symEvent);
            events.set(eventName, symEvent);
        }

        console.log("Unique Event OK", explicit_em.getAgents());

        const agentRelations = new Map();
        for (let agent of agents) {

            console.log("ExplicitToSymbolic.translate - agent", agent);
            //console.log("Nodes", explicit_em.getNodes());
            
            let arcs: BDDNode[] = [];
            for(let node in explicit_em.getNodes()) {

                console.log("Event", node);
                

                // console.log("begin succ")
                for(let succ of explicit_em.getSuccessorsID(node, agent)){
                    let currentEvent = BS.createCopy(event_framed_bdds.get(node));
                    console.log("Succ = ", succ)
                    const succBdd = BS.createCopy(event_framed_bdds.get(succ));
                    // console.log(BS.pickSolutions(succBdd, 10))
                    // console.log("  Succ", succ, succBdd, BS.pickSolutions(succBdd, 10));
                
                    let toprime = SymbolicEpistemicModel.getMapNotPrimeToPrime(BS.support(succBdd));
                    // console.log("toprime", toprime);
                    let succBdd_prime = BS.applyRenaming(BS.createCopy(succBdd), toprime); 
                    // console.log("succBdd_prime", BS.nodeToString(succBdd_prime));
                    // console.log("succBdd_prime", BS.pickSolutions(succBdd_prime, 10));
                    //alert("seen one succ");
                    arcs.push(BS.applyAnd([currentEvent,succBdd_prime]));
                }
                // alert("seen all succ");
                /* building result */
            }
            const arcsBdd = BS.applyOr(arcs);
            console.log("relation for agent", agent, BS.nodeToString(arcsBdd), BS.pickSolutions(arcsBdd));
            agentRelations.set(agent, arcsBdd);
        }

        
        let symb_em = new SymbolicEventModel(agents, variables,
            events, agentRelations, explicit_em.getPointedAction());

        console.log("END ExplicitToSymbolic.translate");
        console.log("==================================")


        return symb_em;
    }

    /**
     * Return the event, define as precondition:Formula and postcondition: Postcondition as BDD
     * @param pre Formula as precondition
     * @param post Poscondition as postcondition, like Map<atom, new value>
     */
    static _event_to_bdd(pre: Formula, post: Postcondition): BDDNode {

        // console.log("event_to_bdd", pre, post, "->", post.getValuation().toString());

        let bdd_prec = BDD.buildFromFormula(pre);
        let bdd_post = null;
        if (post instanceof TrivialPostcondition) {
            let transfert = SymbolicEventModel.varsToPosted(BDD.bddService.support(bdd_prec));
            // console.log("Post is Trivial", transfert);
            bdd_post = BDD.bddService.applyRenaming(BDD.bddService.createCopy(bdd_prec), transfert);
        } else {
            let transform: Map<string, boolean> = new Map();
            for (let [key, value] of Object.entries(post.getValuation())) {
                transform.set(SymbolicEventModel.getPostedVarName(key), <boolean>value);
            }
            bdd_post = BDD.bddService.createCube(transform);
            // console.log("CUBE", transform, bdd_post);
        }
        // console.log("end event_to_bdd", bdd_prec, bdd_post);
        // console.log("prec", BDD.bddService.pickAllSolutions(bdd_prec))
        // console.log("post", BDD.bddService.pickAllSolutions(bdd_post))
        let res = BDD.bddService.applyAnd([bdd_prec, bdd_post]);
        // console.log("and", BDD.bddService.pickAllSolutions(res))
        return res;
    }

    /**
     * Method to calculate the BDDNode of the frame axiom : for all vars BigAnd[var<->+_var]
     * @param vars list of atoms.
     * @param prime if prime, add prime to calculation : BigAnd[var_p<->+_var_p]
     */
    static _frame(vars: string[], prime: boolean): BDDNode {
        // console.log("call frame", vars, prime)

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
