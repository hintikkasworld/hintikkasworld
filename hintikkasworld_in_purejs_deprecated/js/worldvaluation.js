'use strict';


class WorldValuation extends Valuation {
  constructor(propositions) {
    super(propositions);

    this.agentPos = {};
    this.agentPos["a"] = {x: 32, y:32, r: 16};
    this.agentPos["b"] = {x: 64, y:32, r: 16};
    this.agentPos["c"] = {x: 96, y:32, r: 16};
  
  }

  draw(context)  {
    this.drawAgents(context);
  }


  drawAgents(context)  {
    for(let a of agents)
    if(this.agentPos[a] != undefined)
      context.drawImage(agentImages[a], this.agentPos[a].x-this.agentPos[a].r,
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
      context.fillStyle = getAgentColor(agentName);
      
      let triangleHeight = 8;
      let triangleEspacement = 4;
      context.moveTo(rectangle.x1, rectangle.y1-triangleHeight-triangleEspacement);
      context.lineTo(rectangle.x1+  rectangle.w/2, rectangle.y1-triangleEspacement);
      context.lineTo(rectangle.x1+  rectangle.w, rectangle.y1-triangleHeight-triangleEspacement);
      //context.rect(rectangle.x1, rectangle.y1, rectangle.w, rectangle.h);
      context.fill();
  }
  
  

  getShortDescription() {
    return this.toString();
  }
}







class GenericWorldValuation extends WorldValuation {
  draw(context)
  {
    super.draw(context);
    context.strokeText(this.toString(), 0, 54);
  }



}
