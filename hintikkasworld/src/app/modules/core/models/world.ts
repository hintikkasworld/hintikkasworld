import { Rectangle } from './rectangle';
import { environment } from 'src/environments/environment';


export class World {
    protected agentPos;
   private static agentImages = {};

   static getAgents() {
       return environment.agents;
   }

  static getAgentImages() {
      let agentImages = {};
        for(let agent of this.getAgents()) {
          agentImages[agent] = new Image();
          agentImages[agent].src = "img/agent" + agent + ".png";
        }
        return agentImages;
   }

    constructor() {

    }



    drawAgents(context)  {
        for(let a of World.getAgents())
        if(this.agentPos[a] != undefined)
          context.drawImage(World.agentImages[a], this.agentPos[a].x-this.agentPos[a].r,
                              this.agentPos[a].y-this.agentPos[a].r,
                              this.agentPos[a].r*2, this.agentPos[a].r*2);
      }
      


      getAgentRectangle(agentName)  {
        if(this.agentPos[agentName] == undefined)
          return new Rectangle(1000, 1000, -1, -1);
        else
        return new Rectangle(this.agentPos[agentName].x-this.agentPos[agentName].r,
                             this.agentPos[agentName].y-this.agentPos[agentName].r,
                             this.agentPos[agentName].r*2, this.agentPos[agentName].r*2);
    }

    
      drawAgentSelection(context, agentName) {
        context.beginPath();
        
        let rectangle = this.getAgentRectangle(agentName);
       // context.strokeStyle = getAgentColor(agentName);
        context.fillStyle = this.agentService.getAgentColor(agentName);
        
        let triangleHeight = 8;
        let triangleEspacement = 4;
        context.moveTo(rectangle.x1, rectangle.y1-triangleHeight-triangleEspacement);
        context.lineTo(rectangle.x1+  rectangle.w/2, rectangle.y1-triangleEspacement);
        context.lineTo(rectangle.x1+  rectangle.w, rectangle.y1-triangleHeight-triangleEspacement);
        //context.rect(rectangle.x1, rectangle.y1, rectangle.w, rectangle.h);
        context.fill();
    }
}
