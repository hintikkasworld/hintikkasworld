import { BDDNode } from './../models/eventmodel/explicit-to-symbolic';
import { Formula } from './../models/formula/formula';
import { BddService } from './../../../services/bdd.service';
import * as types from  './../models/formula/formula';

/// <reference lib="webworker" />

let bddService = new BddService( () => {});


function getBDDNode(phi: Formula): BDDNode {
  switch (true) {
      case (phi instanceof types.TrueFormula): return bddService.createTrue();
      case (phi instanceof types.FalseFormula): return bddService.createFalse();
      case (phi instanceof types.AtomicFormula): 
          return bddService.createLiteral((<types.AtomicFormula>phi).getAtomicString());
      case (phi instanceof types.ImplyFormula):
          return bddService.applyImplies(this.getBDDNode((<types.ImplyFormula>phi).formula1), this.getBDDNode((<types.ImplyFormula>phi).formula2));
      case (phi instanceof types.EquivFormula):
          return bddService.applyEquiv(this.getBDDNode((<types.EquivFormula>phi).formula1), this.getBDDNode((<types.EquivFormula>phi).formula2));
      case (phi instanceof types.AndFormula):
          return bddService.applyAnd((<types.AndFormula>phi).formulas.map((f) => this.getBDDNode(f)));
      case (phi instanceof types.OrFormula):
          return bddService.applyOr((<types.OrFormula>phi).formulas.map((f) => this.getBDDNode(f)));
      case (phi instanceof types.XorFormula): {
          throw new Error("to be implemented");
      }
      case (phi instanceof types.NotFormula): return bddService.applyNot(this.getBDDNode((<types.NotFormula>phi).formula));
      case (phi instanceof types.KFormula): {
          throw new Error("formula should be propositional");
      }
      case (phi instanceof types.KposFormula):
          throw new Error("formula should be propositional");
      case (phi instanceof types.KwFormula): {
          throw new Error("formula should be propositional");
      }
      case (phi instanceof types.ExactlyFormula): {
          return createExactlyBDD((<types.ExactlyFormula>phi).count, (<types.ExactlyFormula>phi).variables);
      }
  }
  throw Error("type of phi not found");
}




function createExactlyBDD(n: number, vars: string[]): BDDNode {

  const cache: Map<string, BDDNode> = new Map();

  const getNamongK = (n: number, k:number) => {

      const key =  n + "," + k;

      if(cache.has(key)) return cache.get(key);
      if(n==0){
          const assignment = new Map();
          for(let v of vars.slice(0, k)){
              assignment.set(v, false);
          }
          cache.set(key, bddService.createCube(assignment));
          return cache.get(key);
      }
      if(k == 0) return bddService.createFalse();

      let x = bddService.createLiteral(vars[k-1]);
      let bdd_1 = bddService.createCopy(getNamongK(n-1, k-1));
      let bdd_2 = bddService.createCopy(getNamongK(n, k-1));
      let res = bddService.applyIte(x, bdd_1, bdd_2);
      cache.set(key, res);
      return res;

  }

  let res = bddService.createCopy(getNamongK(n, vars.length));
  
  cache.forEach((value, key) => {
      bddService.destroy(value);
  });

  return res;

}








addEventListener('message', ({ data }) => {
  const response = //`worker response to ${data}`;
        getBDDNode(data.formula);

  postMessage(response);
});
