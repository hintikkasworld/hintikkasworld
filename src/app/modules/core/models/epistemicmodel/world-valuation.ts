import { Valuation } from './valuation';
import { World } from './world';

export class WorldValuation extends World {
        valuation: Valuation;

        constructor(valuation: Valuation) {
          super();
          this.valuation = valuation;
      
          this.agentPos = {};
     
        
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
