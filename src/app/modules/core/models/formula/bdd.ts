import { Valuation } from './../epistemicmodel/valuation';
<<<<<<< HEAD
import { BddService} from 'src/app/services/bdd.service';
import { Formula } from './formula';
import * as types from './../formula/formula';
import {BDDNode} from 'src/app/modules/core/models/epistemicmodel/bddnode';
import { from } from 'rxjs';
=======
import { BddService } from './../../../../services/bdd.service';
import { Formula } from './formula';
import * as types from './../formula/formula';
import { BDDNode } from './../epistemicmodel/bddnode'
>>>>>>> d3a25c608aa23d57a4e0da62a52ae7aa70377d48

export class BDD {

    bddNode: BDDNode;
    static bddService: BddService = new BddService(() => {});

    constructor(b:BDDNode) {
        // BDD.bddService.save(b); 
    }

    get thisbddNode() {
        return this.bddNode;
    }
    static buildFromFormula(f:Formula):BDDNode {
        return BDD.getBDDNode(f);
    }
    pickRandomSolution(): Valuation {
        return BDD.bddService.pickRandomSolution(this.bddNode);
    }
    private static getBDDNode(phi: Formula): BDDNode {
        switch (true) {
            case (phi instanceof types.TrueFormula): return BDD.bddService.createTrue();
            case (phi instanceof types.FalseFormula): return BDD.bddService.createFalse();
            case (phi instanceof types.AtomicFormula): 
                return BDD.bddService.createLiteral((<types.AtomicFormula>phi).getAtomicString());
            case (phi instanceof types.ImplyFormula):
                return BDD.bddService.applyImplies(this.getBDDNode((<types.ImplyFormula>phi).formula1), this.getBDDNode((<types.ImplyFormula>phi).formula2));
            case (phi instanceof types.EquivFormula):
                return BDD.bddService.applyEquiv(this.getBDDNode((<types.EquivFormula>phi).formula1), this.getBDDNode((<types.EquivFormula>phi).formula2));
            case (phi instanceof types.AndFormula):
                return BDD.bddService.applyAnd((<types.AndFormula>phi).formulas.map((f) => this.getBDDNode(f)));
            case (phi instanceof types.OrFormula):
                return BDD.bddService.applyOr((<types.OrFormula>phi).formulas.map((f) => this.getBDDNode(f)));
            case (phi instanceof types.XorFormula): {
                throw new Error("to be implemented");
            }
            case (phi instanceof types.NotFormula): return BDD.bddService.applyNot(this.getBDDNode((<types.NotFormula>phi).formula));
            case (phi instanceof types.KFormula): {
                throw new Error("formula should be propositional");
            }
            case (phi instanceof types.KposFormula):
                throw new Error("formula should be propositional");
            case (phi instanceof types.KwFormula): {
                throw new Error("formula should be propositional");
            }
            case (phi instanceof types.ExactlyFormula): {
                return BDD.createExactlyBDD((<types.ExactlyFormula>phi).count, (<types.ExactlyFormula>phi).variables);
            }
        }
        throw Error("type of phi not found");
    }


    private static createExactlyBDD(n: number, vars: string[]): BDDNode {

        const cache: Map<string, BDDNode> = new Map();

        const getNamongK = (n: number, k:number) => {

            const key =  n + "," + k;

            if(cache.has(key)) return cache.get(key);
            if(n==0){
                const assignment = new Map();
                for(let v of vars.slice(0, k)){
                    assignment.set(v, false);
                }
                cache.set(key, BDD.bddService.createCube(assignment));
                return cache.get(key);
            }
            if(k == 0) return BDD.bddService.createFalse();

            let x = BDD.bddService.createLiteral(vars[k-1]);
            let bdd_1 = BDD.bddService.createCopy(getNamongK(n-1, k-1));
            let bdd_2 = BDD.bddService.createCopy(getNamongK(n, k-1));
            let res = BDD.bddService.applyIte(x, bdd_1, bdd_2);
            cache.set(key, res);
            return res;

        }

        let res = BDD.bddService.createCopy(getNamongK(n, vars.length));
        
        cache.forEach((value, key) => {
            BDD.bddService.destroy(value);
        });

        return res;

    }

    static and(lb:BDD[]):BDD {
        return new BDD(BDD.bddService.applyAnd(lb.map(b => (b.thisbddNode))))
    }
    static or(lb:BDD[]):BDD {
        return new BDD(BDD.bddService.applyOr(lb.map(b => (b.thisbddNode))))
    }
    static not(b:BDD):BDD {
        return new BDD(BDD.bddService.applyNot(b.thisbddNode))
    }
    static imply(b1:BDD,b2:BDD):BDD {
        return new BDD(BDD.bddService.applyImplies(b1.thisbddNode,b2.thisbddNode))
    }
    static equiv(b1:BDD,b2:BDD):BDD {
        return new BDD(BDD.bddService.applyEquiv(b1.thisbddNode,b2.thisbddNode))
    }
    static universalforget(b:BDD,vars:string[]) {
        return new BDD(BDD.bddService.applyUniversalForget(b.thisbddNode,vars))
    }
    static existentialforget(b:BDD,vars:string[]) {
        return new BDD(BDD.bddService.applyExistentialForget(b.thisbddNode,vars))
    }

}
