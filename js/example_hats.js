'use strict';


var bluehat = loadImage("img/bluehat.png");
var redhat = loadImage("img/redhat.png");
var blind = loadImage("img/blind.png");


class HatsWorld extends WorldValuation {
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
        if(this.modelCheck(a + "B"))
         context.drawImage(bluehat, this.agentPos[a].x-16, 12, 32, 32);
        if(this.modelCheck(a + "R"))
          context.drawImage(redhat, this.agentPos[a].x-12, 10, 32, 32);
      }
      
    }
}


function setExampleHats() {
  function getExampleHats(){
    let M= new EpistemicModel();
    M.addWorld("wBBB",new HatsWorld(["aB","bB","cB"]));
    M.addWorld("wBBR",new HatsWorld(["aB","bB","cR"]));
    M.addWorld("wBRB",new HatsWorld(["aB","bR","cB"]));
    M.addWorld("wRBB",new HatsWorld(["aR","bB","cB"]));
    M.addWorld("wRRB",new HatsWorld(["aR","bR","cB"]));
    M.addWorld("wBRR",new HatsWorld(["aB","bR","cR"]));
    M.addWorld("wRBR",new HatsWorld(["aR","bB","cR"]));

    M.addEdgesCluster("a", ["wBBB","wRBB"]);
    M.addEdgesCluster("a", ["wBBR","wRBR"]);
    M.addEdgesCluster("a", ["wBRB","wRRB"]);
    M.addEdge("a", "wBRR","wBRR");

    M.addEdgesCluster("b", ["wBBB","wBRB"]);
    M.addEdgesCluster("b", ["wBBR","wBRR"]);
    M.addEdgesCluster("b", ["wRBB","wRRB"]);
    M.addEdge("b","wRBR","wRBR");


    let names = new Array();
    for(name in M.nodes)
      names.push(name);

    M.addEdgesCluster("c",names);
    M.setPointedWorld("wBRB"); //peut aussi être BBB, RBB ou RRB.

    return M;
  }

  M= getExampleHats();

  addExplanation("We consider the following commonly known situation. Agents a, b and c are given three hats. There are three blue hats and two red hats. There is no mirror so agents a and b can't see the color of their own hats, but can see the color of the others'. Agent c is blind. In this example, agent a tells he doesn't know his hat's color, then agent b tells he doesn't know his hat's color; and agent c is finally able to guess his hat's color.")

  for(let a of agents) {
    let phi = "((not (K " + a + " " +  a + "B)) and (not (K " + a + " " + a + "R)))";
    addAction({label: "Agent " + a + " says he doesn't know whether his hat is red or blue.",
            precondition: phi,
            actionModel: getActionModelPublicAnnouncement(phi),
            message:  "I don't know my hat's color.",
            saidby: a
    });
  }

    compute();
    computeButtonsVisibleOrNot();

}
