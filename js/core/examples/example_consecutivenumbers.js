'use strict';
/**
 * @param truePropositions an array of true propositions
 * @returns a state where two agents have consecutive numbers
 * @example new ConsecutiveNumbers(["a3", "b4"])
 * */
class ConsecutiveNumbersWorld extends WorldValuation
{
    static get consequenceNumbersImax() {return 10;}

    constructor(propositions) {
        super(propositions);
        this.agentPos["a"] = {x: 24, y: 24, r: 24};
        this.agentPos["b"] = {x: 128-24, y: 24, r: 24};
        this.agentPos["c"] = undefined;
    }

    draw(context)  {
        this.drawAgents(context);

        for(let a of agents)
        for(var i = 1; i <= ConsecutiveNumbersWorld.consequenceNumbersImax; i++) 
          if(this.modelCheck(a + i))
            drawCard(context, {x: this.agentPos[a].x, y: 48, w:16, text: i});

    }
}








function getConsecutiveNumbersInitialEpistemicModel() {
  let M = new EpistemicModel();

  for(var ia = 1; ia <= ConsecutiveNumbersWorld.consequenceNumbersImax; ia++)
  for(var ib = ia-1; ib <= ia+1; ib+=2)
  if(ib >= 1)
          M.addWorld("w" + ia + ib, new ConsecutiveNumbersWorld(["a" + ia, "b" + ib]));


  for(var i = 1; i <= ConsecutiveNumbersWorld.consequenceNumbersImax; i++)
          if((1<=i-1) && (i+1)<= ConsecutiveNumbersWorld.consequenceNumbersImax) {
                let iplus1 = (i+1).toString();
                let imoins1 = (i-1).toString();
                M.addEdge("a", "w" + i + imoins1, "w" + i + iplus1);
                M.addEdge("a", "w" + i + iplus1, "w" + i + imoins1);
                M.addEdge("b", "w" + iplus1 + i, "w" + imoins1 + i);
                M.addEdge("b", "w" + imoins1 + i, "w" + iplus1 + i);
          }


  M.makeReflexiveRelation("a");
  M.makeReflexiveRelation("b");

  M.setPointedWorld("w34");
  M.removeUnReachablePartFrom("w34");

  return M;
}






function setExampleConsecutiveNumbers() {
  M = getConsecutiveNumbersInitialEpistemicModel();


     $('#panelExampleFormulas').html('Example of formulas: '
    + "<ul><li>b3</li>" +
      "<li>(b2 or b3)</li>" +
      "</ul>");



  addExplanation("We give a number between 1 and 10 to each agent. It is commonly known that the two numbers are consecutive.");


  for(var a of ["a", "b"])
  for(var b of ["a", "b"])
  if(a != b) {
    var pronom = (a == "a") ? "she" : "he";

    (function(a, b) {
         addAction({label: "Agent " + a + " announces that " + pronom + " knows the number of agent " + b + ".",
              precondition: getConsequenceNumberFormulaAgentKnowOtherNumber(a),
              actionModel: getActionModelPublicAnnouncement(getConsequenceNumberFormulaAgentKnowOtherNumber(a)),
              message:  "I know your number",
              saidby: "a"
            });
         
         addAction({label:  "Agent " + a + " announces that " + pronom + " does not know the number of agent " + b + ".",
              precondition: "(not " + getConsequenceNumberFormulaAgentKnowOtherNumber(a) + ")",
              actionModel: getActionModelPublicAnnouncement("(not " + getConsequenceNumberFormulaAgentKnowOtherNumber(a) + ")"),
              message:  "I do not know your number",
              saidby: "a"
            });
      })(a, b);

  }

 compute();
 computeButtonsVisibleOrNot();
}










function getConsequenceNumberFormulaAgentKnowOtherNumber(agent)
{
  var other = (agent == "a") ? "b" : "a";

  var s = "(";

  s += "(K " + agent + " " + other + 1 + ")";

  for(var i = 2; i <= ConsecutiveNumbersWorld.consequenceNumbersImax; i++)
      s += " or " +  "(K " + agent + " " + other + i + ")";

  s += ")";

  return s;
}
