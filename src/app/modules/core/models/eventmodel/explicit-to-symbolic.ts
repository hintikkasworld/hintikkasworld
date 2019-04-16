import { Formula } from './../formula/formula';
import { ExplicitEventModel } from './explicit-event-model';
import { SymbolicEventModel } from './symbolic-event-model';
import { Event } from './event';
import { environment } from 'src/environments/environment';
import { BDD } from '../formula/bdd';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';

export type BDDNode = number;

export class ExplicitToSymbolic {
    
    static translate(explicit_em: ExplicitEventModel, variables: string[]): SymbolicEventModel{
                 
        let symb_em = new SymbolicEventModel(["a"], ["var1"]);
        
        let event_bdd = {};
        
        for (let event in explicit_em.getNodes()){
            let node = explicit_em.getNodes()[event]; 
            event_bdd[event] = ExplicitToSymbolic._event_to_bdd(<Event> node);
            symb_em.addUniqueEvent(event, event_bdd[event]);
        }

        for (let agent in environment.agents){
            for (let event in explicit_em.getNodes()){

                let action = event_bdd[event];

                let liste = variables.slice(0);
                /* Keep the precondition variables */
                for(let variable in BDD.bddService.support(action)){
                    if(!SymbolicEpistemicModel.isPrimed(variable) && !SymbolicEventModel.isPosted(variable)){
                        liste.splice( liste.indexOf(variable), 1 );
                    }
                }
                
                let action_frame = BDD.bddService.applyAnd([action, ExplicitToSymbolic._frame(liste, false)]);
                let pointeur = action_frame;

                let or_others = BDD.bddService.createFalse();
                for(let succ in explicit_em.getSuccessorsID(event, agent)){
                    let action_prime = null;
                    /* action_prime = BDD.bddService.let(Symbolic_em.varsToPrime(), Prevent_bdd[succ]); */
                    let liste = variables.slice(0);
                    let support = BDD.bddService.support(action_prime);
                    for(let variable in support){
                        let var1 = variable.replace("/" + SymbolicEpistemicModel.getPrimedString() +"/g",'');
                        var1 = var1.replace("/" + SymbolicEventModel.getPostedString() +"/g",'');
                        if(var1 in liste){
                            liste.slice( liste.indexOf(var1), 1);
                        }
                    }
                    let action_prime_frame = BDD.bddService.applyAnd([action_prime, ExplicitToSymbolic._frame(liste, true)]);
                    or_others = BDD.bddService.applyOr([or_others, action_prime_frame]);
                }
                symb_em.addPlayerEvent(event, agent, BDD.bddService.applyAnd([pointeur, or_others]))
            }
        }

        
    
        return symb_em;
    }

    static _event_to_bdd(event: Event): BDDNode{
        let bdd_prec = BDD.buildFromFormula(event.pre);
        let bdd_post = null;
        if(event.post == null){
            let posted = {}
            bdd_post = null; /* BDD.BddService.let(SymbolicEventModel.varsToPosted(BDD.BddService.support(bdd_prec), bdd_prec) */
        }else{
            let transform = {};
            for(let vari in event.post){
                transform[SymbolicEventModel.getPostedVarName(vari)] = event.post[vari];
            }
            bdd_post = null; /* BDD.bddService.cube(transform); */
        }
        return BDD.bddService.applyAnd([bdd_prec, bdd_post]);
    }

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

            pointeur = BDD.bddService.applyAnd([pointeur, equiv]);
        }
        return pointeur;
    }

}
