import { Formula } from './../formula/formula';
import { ExplicitEventModel } from './explicit-event-model';
import { SymbolicEventModel } from './symbolic-event-model';
import { Event } from './event';
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
     * @param explicit_em the ExplicitEventModel we want to transform
     * @param variables list of all variables which describe worlds
     * @param agents list of agents
     */
    static translate(explicit_em: ExplicitEventModel, variables: string[], agents: string[]): SymbolicEventModel{

        console.log("ExplicitToSymbolic.translate");

        let symb_em = new SymbolicEventModel(agents, variables);
        
        let event_bdd = {};
        
        for(const [event, value] of <[string, {pre: Formula, post: Postcondition}][]>Object.entries(explicit_em.getNodes())){
            console.log(event, value);
            event_bdd[event] = ExplicitToSymbolic._event_to_bdd(value.pre, value.post);
            console.log(event_bdd[event]);
            symb_em.addUniqueEvent(event, event_bdd[event]);
        }

        console.log("Unique Event OK", explicit_em.getAgents());

        for (let agent of agents){

            console.log("Agent",agent);
            console.log("Nodes", explicit_em.getNodes());
            
            //for(const [event, value] of <[string, {pre: Formula, post: Postcondition}][]>Object.entries(explicit_em.getNodes())){
            // WORKS TO GET pre AND post

            for(let node in explicit_em.getNodes()){
                
                console.log(node, explicit_em.getSuccessorsID(node, agent))

                //let value = node.pre;

                //console.log(agent, event, value);

                let action = event_bdd[node];

                let liste = variables.slice(0);
                /* Keep the precondition variables */
                for(let variable of BDD.bddService.support(action)){
                    if(!SymbolicEpistemicModel.isPrimed(variable) && !SymbolicEventModel.isPosted(variable)){
                        liste.splice( liste.indexOf(variable), 1 );
                    }
                }

                console.log("Preconditions", BDD.bddService.support(action));
                
                let action_frame = BDD.bddService.applyAnd([BDD.bddService.createCopy(action), ExplicitToSymbolic._frame(liste, false)]);
                let pointeur = action_frame;

                console.log("Frame", pointeur)

                let or_others = BDD.bddService.createFalse();

                console.log("Nodes ?", explicit_em.getNodes());

                console.log("SuccessorsID", explicit_em.getSuccessorsID(node, agent));
                
                for(let succ of explicit_em.getSuccessorsID(node, agent)){

                    console.log("Successor", succ);
                    console.log(explicit_em.getSuccessorsID(succ, agent));
                
                    let toprime = SymbolicEpistemicModel.getNotPrimeToPrime(BDD.bddService.support(event_bdd[succ]));
                    let bdd_action_prime = BDD.bddService.applyRenaming(BDD.bddService.createCopy(event_bdd[succ]), toprime); 

                    let liste = variables.slice(0);
                    let support = BDD.bddService.support(bdd_action_prime);

                    for(let variable in support){
                        let var1 = variable.replace("/" + SymbolicEpistemicModel.getPrimedString() +"/g",'');
                        var1 = var1.replace("/" + SymbolicEventModel.getPostedString() +"/g",'');
                        if(var1 in liste){
                            liste.slice( liste.indexOf(var1), 1);
                        }
                    }
                    console.log("Variables", variables);
                    console.log("Support", support);
                    console.log("Liste", liste);

                    let action_prime_frame = BDD.bddService.applyAnd([bdd_action_prime, ExplicitToSymbolic._frame(liste, true)]);
                    console.log("action_prime_frame", action_prime_frame);
                    or_others = BDD.bddService.applyOr([BDD.bddService.createCopy(or_others), action_prime_frame]);
                    console.log("or_others", or_others)
                }
                symb_em.addPlayerEvent(event, agent, BDD.bddService.applyAnd([pointeur, or_others]))
            }
        }

        console.log("END ExplicitToSymbolic.translate");

        return symb_em;
    }

    /**
     * Return the event, define as precondition:Formula and postcondition: Postcondition as BDD
     * @param pre Formula as precondition
     * @param post Poscondition as postcondition, like Map<atom, new value>
     */
    static _event_to_bdd(pre: Formula, post: Postcondition): BDDNode{

        console.log("event_to_bdd", pre, post, "->", post.getValuation());

        let bdd_prec = BDD.buildFromFormula(pre);
        let bdd_post = null;
        if( post instanceof TrivialPostcondition){
            console.log("Post is Trivial");
            bdd_post = BDD.bddService.applyRenaming(BDD.bddService.createCopy(bdd_prec), SymbolicEventModel.varsToPosted(BDD.bddService.support(bdd_prec)));
        }else{
            let transform: Map<string, boolean> = new Map();
            for(let [key, value] of Object.entries(post.getValuation())){
                transform.set(SymbolicEventModel.getPostedVarName(key), <boolean> value);
            }
            bdd_post = BDD.bddService.createCube(transform);
            console.log("CUBE", transform, bdd_post);
        }
        console.log("end event_to_bdd", bdd_prec, bdd_post);
        return BDD.bddService.applyAnd([BDD.bddService.createCopy(bdd_prec), BDD.bddService.createCopy(bdd_post)]);
    }

    /**
     * Method to calculate the BDDNode of the frame axiom : for all vars BigAnd[var<->+_var]
     * @param vars list of atoms.
     * @param prime if prime, add prime to calculation : BigAnd[var_p<->+_var_p]
     */
    static _frame(vars: string[], prime: boolean): BDDNode {
        let pointeur = BDD.bddService.createTrue();
        for(let vari in vars){
            let var1 = vari;
            if(SymbolicEventModel.isPosted(vari)){var1.replace("/" + SymbolicEventModel.getPostedString() +"/g",'');}

            let var2 = SymbolicEventModel.getPostedVarName(vari); /* .getPosted(var); */

            if(prime){ /* if primed : var1 = var1' , var2 = var2' */
                var1 = SymbolicEpistemicModel.getPrimedVarName(vari);
                var2 = SymbolicEpistemicModel.getPrimedVarName(var2);
            }

            let equiv = BDD.bddService.applyEquiv(
                BDD.bddService.createLiteral(var1),
                BDD.bddService.createLiteral(var2));

            pointeur = BDD.bddService.applyAnd([BDD.bddService.createCopy(pointeur), BDD.bddService.createCopy(equiv)]);
        }
        return pointeur;
    }

}
