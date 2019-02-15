import { Valuation } from './valuation';
import { World } from './world';
import { Rectangle } from './rectangle';
import { AgentService } from '../services/agent.service';

export class WorldValuation extends World {
        valuation: Valuation;

        constructor(propositions) {
          super();
          this.valuation = new Valuation(propositions);
      
          this.agentPos = {};
          this.agentPos["a"] = {x: 32, y:32, r: 16};
          this.agentPos["b"] = {x: 64, y:32, r: 16};
          this.agentPos["c"] = {x: 96, y:32, r: 16};
        
        }
      
        draw(context)  {
          this.drawAgents(context);
        }
      
      

        modelCheck(p) {
          return this.valuation.modelCheck(p);
        }
        
        
        
      
        getShortDescription() {
          return this.toString();
        }
}
