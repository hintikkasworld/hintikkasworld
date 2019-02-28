import { Valuation } from './valuation';
import { World } from './world';

export class WorldValuation extends World {
        valuation: Valuation;

        constructor(valuation: Valuation) {
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
          return this.valuation.isPropositionTrue(p);
        }
        
        
        
      toString() {
        return this.valuation.toString();
      }
}
