import { Valuation } from './valuation';
import { World } from './world';

export class WorldValuation extends World {
        valuation: Valuation;

        constructor(propositions: { [id: string]: boolean }) {
          super();
          this.valuation = new Valuation(propositions);
      
          this.agentPos = {};
          this.agentPos["a"] = {x: 32, y:32, r: 16};
          this.agentPos["b"] = {x: 64, y:32, r: 16};
          this.agentPos["c"] = {x: 96, y:32, r: 16};
        
        }
      
        draw(context: CanvasRenderingContext2D)  {
          this.drawAgents(context);
        }
      
      

        modelCheck(p: string) {
          return this.valuation.modelCheck(p);
        }
        
        
        
      toString() {
        return this.valuation.toString();
      }
}
