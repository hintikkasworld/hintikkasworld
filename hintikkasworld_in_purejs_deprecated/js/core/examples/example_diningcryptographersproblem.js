'use strict';


class DiningCryptographersWorld extends WorldValuation
{

  constructor(propositions)
  {
      super(propositions);
      this.agentPos = {};
      this.agentPos["a"] = {x: 64, y:26, r:16};
      this.agentPos["b"] = {x: 16, y:48, r:16};
      this.agentPos["c"] = {x: 128-16, y:48, r:16};
  }


  draw(context)
  {

    context.fillStyle = 'blue';
    context.strokeStyle = 'blue';
    context.font = "10px Verdana";
    for(let a of ["a", "b", "c"])
    for(let b of ["a", "b", "c"])
    if(a < b) {
      if(this.modelCheck("flipDone"))
      {
        let bit = this.modelCheck("p" + a + b) ? 1 : 0;
        context.fillText(bit, (this.agentPos[a].x + this.agentPos[b].x)/2, (this.agentPos[a].y + this.agentPos[b].y)/2+8);
      }
      context.beginPath();
      context.moveTo(this.agentPos[a].x, this.agentPos[a].y);
      context.lineTo(this.agentPos[b].x, this.agentPos[b].y);
      context.stroke();
    }


    this.drawAgents(context);

    if(this.modelCheck("announcementDone"))
    {
      context.fillStyle = 'black';
      context.font = "12px Verdana";
      for(let a of ["a", "b", "c"]) {
        let bit = this.modelCheck(a + "ann") ? 1 : 0;
        context.fillText(bit, this.agentPos[a].x-this.agentPos[a].r+16, this.agentPos[a].y-16);

        if(this.modelCheck(a + "p"))
          context.fillText("$", this.agentPos[a].x-this.agentPos[a].r+8, this.agentPos[a].y+8);
      }
    }

  }

}







function getDiningCryptographersInitialEpistemicModel()
{
  let M = new EpistemicModel();
  M.addWorld("wap", new DiningCryptographersWorld(["ap"]))
  M.addWorld("wbp", new DiningCryptographersWorld(["bp"]))
  M.addWorld("wcp", new DiningCryptographersWorld(["cp"]))
  M.addWorld("wnsap", new DiningCryptographersWorld(["nsap"]))

  M.addEdgeIf("a", (world1, world2) => world1.modelCheck("ap") == world2.modelCheck("ap"));
  M.addEdgeIf("b", (world1, world2) => world1.modelCheck("bp") == world2.modelCheck("bp"));
  M.addEdgeIf("c", (world1, world2) => world1.modelCheck("cp") == world2.modelCheck("cp"));

  if(Math.random() < 0.5)
    M.setPointedWorld('wap');// w = 'wap';
  else
    M.setPointedWorld('wnsap');//w = 'wnsap';

  return M;
}





function setExampleDiningCryptographers()
{
    M = getDiningCryptographersInitialEpistemicModel();


      addExplanation("Agents a, b and c are in a restaurant. Either agent a, agent b, agent c or the NSA paid the meals. The objective is to communicate so that, at the end: either all agents commonly know that NSA paid, or they commonly know that one agents paid without knowing which one (except for the one who paid!).");


      addExplanation("First, they will randomly flip  all bits shared by two agents.", "(not flipDone)");


        addButtonAction(function() {
              function getActionModelFlipBitFor(agents) {
                let E = new ActionModel();
                let atomicProposition = "p" + agents;
                var assignment1 = {};
                var assignment2 = {};

                if(Math.random() < 0.5)  {
                    assignment1[atomicProposition] = "top";
                    assignment2[atomicProposition] = "bottom";
                }
                else {
                  assignment2[atomicProposition] = "top";
                  assignment1[atomicProposition] = "bottom";
                }
                assignment1["flipDone"] = "top";
                assignment2["flipDone"] = "top";

                E.addAction("e", "top", new PropositionalAssignmentsPostcondition(assignment1));
                E.addAction("f", "top", new PropositionalAssignmentsPostcondition(assignment2));
                E.makeReflexiveRelation("a");
                E.makeReflexiveRelation("b");
                E.makeReflexiveRelation("c");
                for(var a of ["a", "b", "c"])
                if(a != agents[0] && a != agents[1])  {
                  E.addEdge(a, "e", "f");
                  E.addEdge(a, "f", "e");
                }
                E.setPointedAction("e");
                return E;
              }
              let Eab = getActionModelFlipBitFor("ab");
              let Ebc = getActionModelFlipBitFor("ac");
              let Eac = getActionModelFlipBitFor("bc");

              M = products(M, [Eab, Ebc, Eac]);
              computeButtonsVisibleOrNot();
              compute();
          },   "Flip the blue bits shared by two bits.", "(not flipDone)");


          addExplanation("Second, each agent anounces, either the xor of the two blue bits they see if she did not pay, or the negation of the xor if she paid.", "(flipDone and (not announcementDone))");

        addButtonAction(function() {
                function getActionModelPublicAnnouncementBit(agent) {
                  let E = new ActionModel();

                  let assignment = {};
                  let atomicProposition = agent + "ann";

                  let xorExpression;
                  if(agent == "a")
                      xorExpression = "(pab xor pac)";
                   else if(agent == "b")
                       xorExpression = "(pab xor pbc)";
                   else if(agent == "c")
                         xorExpression = "(pac xor pbc)";
                  else
                      throw "error in the public announcement";

                  if(M.modelCheck(M.getPointedWorld(), agent + "p"))
                      assignment[atomicProposition] = M.modelCheck(M.getPointedWorld(), createFormula("(not " + xorExpression + ")"));
                  else
                      assignment[atomicProposition] = M.modelCheck(M.getPointedWorld(), createFormula(xorExpression));

                  let formula = "(" + agent + "p equiv (" +assignment[atomicProposition]  + " equiv (not " + xorExpression + ")))";
                  assignment["announcementDone"] = "top";
                  E.addAction("e", formula, new PropositionalAssignmentsPostcondition(assignment));
                  E.makeReflexiveRelation("a");
                  E.makeReflexiveRelation("b");
                  E.makeReflexiveRelation("c");
                  E.setPointedAction("e");
                  return E;
                }
                M = product(M, getActionModelPublicAnnouncementBit("a"));
                M = product(M, getActionModelPublicAnnouncementBit("b"));
                M = product(M, getActionModelPublicAnnouncementBit("c"));

                computeButtonsVisibleOrNot();
                compute();
              }, "Announcements.", "(flipDone and (not announcementDone))");


}
