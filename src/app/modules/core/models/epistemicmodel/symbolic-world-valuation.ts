import { Valuation } from './valuation';
import { World } from './world';
import { BDD } from '../formula/bdd';

export class SymbolicWorldValuation extends World {

        valuation: BDD;

        constructor(valuation: BDD) {
          super();
          this.valuation = valuation;
      
          this.agentPos = {};
          this.agentPos["a"] = {x: 32, y:32, r: 16};
          this.agentPos["b"] = {x: 64, y:32, r: 16};
          this.agentPos["c"] = {x: 96, y:32, r: 16};
        
        }
      
        draw(context: CanvasRenderingContext2D)  {
          this.drawAgents(context);
        }
      
        modelCheck(p: string) {
        throw new Error("not implemented");
        }
        
      toString() {
        return this.valuation.toString();
      }
      
}
