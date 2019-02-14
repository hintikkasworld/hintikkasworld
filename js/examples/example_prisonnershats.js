'use strict';


var blackhat = loadImage("img/blackhat.png");
var whitehat = loadImage("img/whitehat.png");
var blind = loadImage("img/blind.png");

class PrisonnersHatsWorld extends WorldValuation{
  constructor(propositions) {
      super(propositions);
      this.agentPos["a"] = {x: 6+16, y: 32+16, r: 16};
      this.agentPos["b"] = {x: 48+16, y: 32+16, r: 16};
      this.agentPos["c"] = {x: 90+16, y: 32+16, r: 16};
  }

  draw(context) {
      this.drawAgents(context);
      context.drawImage(blind,this.agentPos["c"].x-16,28,32,32);

      for(let a of ["a", "b", "c"]) {
        if(this.modelCheck(a + "0"))
         context.drawImage(blackhat, this.agentPos[a].x-16, 12, 32, 32);
        if(this.modelCheck(a + "1"))
          context.drawImage(whitehat, this.agentPos[a].x-12, 10, 32, 32);
      }
      
      
      drawVisibilityLine(context, this.agentPos["a"].x+6, this.agentPos["a"].y-8, this.agentPos["b"].x, this.agentPos["b"].y-24);
      drawVisibilityLine(context, this.agentPos["b"].x+6, this.agentPos["b"].y-8, this.agentPos["c"].x, this.agentPos["c"].y-24);
    }
}


function getExamplePrisonnersHats()
{
  let M = new EpistemicModel();

  M.addWorld("w001", new PrisonnersHatsWorld(["a0", "b0","c1"]));
  M.addWorld("w100", new PrisonnersHatsWorld(["a1","b0","c0"]));
  M.addWorld("w011", new PrisonnersHatsWorld(["a0","b1","c1"]));
  M.addWorld("w101", new PrisonnersHatsWorld(["a1","b0","c1"]));
  M.addWorld("w110", new PrisonnersHatsWorld(["a1","b1","c0"]));
  M.addWorld("w010", new PrisonnersHatsWorld(["a0","b1","c0"]));
  
  M.addEdgesCluster("a", ["w001", "w101"]);
  M.addEdgesCluster("a", ["w110", "w010"]);
  M.addEdgesCluster("b", ["w001", "w101"]);
  M.addEdgesCluster("b", ["w011", "w101"]);
  M.addEdgesCluster("b", ["w110", "w100"]);
  M.addEdgesCluster("b", ["w001", "w011"]);
  M.addEdgesCluster("b", ["w110", "w010"]);
  M.addEdgesCluster("b", ["w010", "w100"]);
  
  let names = new Array();
    for(name in M.nodes)		
      names.push(name);

    M.addEdgesCluster("c",names);

  M.setPointedWorld("w001");
  return M;
}


function setExamplePrisonnersHats() {
  M= getExamplePrisonnersHats();

  addExplanation("We consider the following commonly known situation. Agents a, b and c are given three hats. There are two black hats and two white hats. Agents a and b can't see the color of their own hats, but can see the color of the others'. Agent c is blind he can't see anything.")
  
  for(let a of agents) {
      let announcement = "((not (K " + a + " " + a + "0)) and (not (K " + a +  " " + a + "1)))";
        addAction({label: "Agent " + a + " says he doesn't know whether his hat is white or black.",
              precondition: announcement,
              actionModel: getActionModelPublicAnnouncement(announcement),
              message:  "I don't know my hat's color.",
              saidby: a
            });
  }
  
  compute();
  computeButtonsVisibleOrNot();
}
