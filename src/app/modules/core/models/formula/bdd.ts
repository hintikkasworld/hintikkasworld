import { Valuation } from './../epistemicmodel/valuation';
import { BDDNode, BddService } from './../../../../services/bdd.service';
import { Formula } from './formula';
import * as types from './../formula/formula';

export class BDD {

    bddNode: BDDNode;
    static bddService: BddService = new BddService();

    constructor(b:BDDNode) {
       
        BDD.bddService.save(b); 
        

    }
    get thisbddNode() {
        return this.bddNode;
    }
    static buildFromFormula(f:Formula):BDD {
        return new BDD(BDD.getBDDNode(f))
    }
    pickRandomSolution(): Valuation {
        return BDD.bddService.pickRandomSolution(this.bddNode);
    }
    private static getBDDNode(phi: Formula): BDDNode {
        switch (true) {
            case (phi instanceof types.TrueFormula): return BDD.bddService.createTrue();
            case (phi instanceof types.FalseFormula): return BDD.bddService.createFalse();
            case (phi instanceof types.AtomicFormula): return BDD.bddService.createAtom((<types.AtomicFormula>phi).getAtomicString());
            case (phi instanceof types.ImplyFormula):
                return BDD.bddService.createImply(this.getBDDNode((<types.ImplyFormula>phi).formula1), this.getBDDNode((<types.ImplyFormula>phi).formula2));
            case (phi instanceof types.EquivFormula):
                return BDD.bddService.createEquiv(this.getBDDNode((<types.ImplyFormula>phi).formula1), this.getBDDNode((<types.ImplyFormula>phi).formula2));
            case (phi instanceof types.AndFormula):
                return BDD.bddService.createAnd((<types.AndFormula>phi).formulas.map((f) => this.getBDDNode(f)));

            case (phi instanceof types.OrFormula):
                return BDD.bddService.createOr((<types.AndFormula>phi).formulas.map((f) => this.getBDDNode(f)));
            case (phi instanceof types.XorFormula): {
                throw new Error("to be implemented");
            }
            case (phi instanceof types.NotFormula): return BDD.bddService.createNot(this.getBDDNode((<types.NotFormula>phi).formula));
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
    }




    private static createExactlyBDD(n: number, vars: string[]) {
        let dic: BDDNode[];

        function store(kVar: number, i: number, b: BDDNode) {
            dic[kVar * n + i] = b;
        }

        function getExactlyBDD(kVar, i) {
            return dic[kVar * n + i];
        }

        for (let kVar = vars.length - 1; kVar >= 0; kVar--) {
            store(kVar, 0, this.getBDDNode(new types.AndFormula(vars.slice(kVar).map((p) => new types.NotFormula(new types.AtomicFormula(p))))));

            for (let i = 0; i <= n; i++) {
                    let b1 = getExactlyBDD(kVar+1, i-1);
                    let b2 = getExactlyBDD(kVar+1, i);

                    store(kVar, i, BDD.bddService.createIte(vars[kVar], b1, b2));
            }
        }

        return getExactlyBDD(0, n);
    }

    static and(lb:BDD[]):BDD {
        return new BDD(BDD.bddService.createAnd(lb.map(b => (b.thisbddNode))))
    }
    static or(lb:BDD[]):BDD {
        return new BDD(BDD.bddService.createOr(lb.map(b => (b.thisbddNode))))
    }
    static not(b:BDD):BDD {
        return new BDD(BDD.bddService.createNot(b.thisbddNode))
    }
    static imply(b1:BDD,b2:BDD):BDD {
        return new BDD(BDD.bddService.createImply(b1.thisbddNode,b2.thisbddNode))
    }
    static equiv(b1:BDD,b2:BDD):BDD {
        return new BDD(BDD.bddService.createEquiv(b1.thisbddNode,b2.thisbddNode))
    }
    static universalforget(b:BDD,vars:string[]) {
        return new BDD(BDD.bddService.createUniversalForget(b.thisbddNode,vars))
    }
    static existentialforget(b:BDD,vars:string[]) {
        return new BDD(BDD.bddService.createExistentialForget(b.thisbddNode,vars))
    }

}
