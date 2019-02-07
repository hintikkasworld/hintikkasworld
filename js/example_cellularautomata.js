'use strict';
/**
 * @param truePropositions an array of true propositions
 * @returns a state where two agents have consecutive numbers
 * @example new CellularAutomataWorld(["p", "r"])
 * */
class CellularAutomataWorld extends WorldValuation
{
    constructor(propositions, initValue)
    {
        super(propositions);
        this.value = initValue || 0;
    }

    setAgentPositions() {
      let posleft = {x: 24, y: 32, r: 24};
      let posright = {x: 128-24, y: 32, r: 24};
      if(this.modelCheck("r")) {
        this.agentPos["a"] = posleft;
        this.agentPos["b"] = posright;
      }
      else {
        this.agentPos["a"] = posright;
        this.agentPos["b"] = posleft;
      }

      this.agentPos["c"] = undefined;
    }

    draw(context) {
        let ytop = 32-8;
        let height = 32;
        /*background of the cell depending on r*/
        if(this.modelCheck("r"))
          context.fillStyle = "gray";
        else
          context.fillStyle = "white";
        context.fillRect(58-16, ytop, 32, height);
        context.drawImage(CellularAutomataWorld.cellsImg[this.value], 58-16, ytop, 32, height);
        context.strokeStyle="#000000";

        for(let y of [ytop, ytop+height]) {
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(128, y);
          context.stroke();
        }

        context.strokeRect(58-16, ytop, 32, height);
        context.font="20px Verdana";


        context.fillStyle = "black";
        context.fillText(this.value, 58-8, 32+16);

        this.setAgentPositions();
        this.drawAgents(context);
    }

    getShortDescription() {
      let suppl = "";

      if(this.modelCheck("r"))
        suppl = " (r)";
      return this.value + suppl;
    }
}



CellularAutomataWorld.cellsImg = {};

for(let symbol of ['0', '1']) {
  CellularAutomataWorld.cellsImg[symbol] = new Image();
  CellularAutomataWorld.cellsImg[symbol].src = "img/cell" + symbol + ".png";
}






function getCellularAutomataInitialEpistemicModel(inputWord)
{
  let M = new EpistemicModel();

  let n = inputWord.length;

  let i1 = -Math.floor(n/2)-1;
  let i2 = Math.floor(n/2)+1;

  function getInputSymbol(i) {
    let j = i-i1-1;
    if(j < 0) return "0";
    if(j > inputWord.length-1) return "0";
    return inputWord[j];
  }

  for(let i = i1; i<=i2; i++) {
    let propositions = (i%2 == 0) ? ["r"] : [];
    M.addWorld("w" + i, new CellularAutomataWorld(propositions,getInputSymbol(i)));
  }


  M.makeReflexiveRelation("a");
  M.makeReflexiveRelation("b");

  for(let i = i1; i<i2; i++) {
    if(i % 2 == 0)
        M.addEdge("b", "w" + i, "w" + (i+1));
    else
      M.addEdge("a", "w" + i, "w" + (i+1));
  }
  M.makeSymmetricRelation("a");
  M.makeSymmetricRelation("b");

  M.setPointedWorld("w0");

  return M;
}










function getRule110CellularAutomataTransitionFunctionText() {
    return "000 0" + "\n" +
            "001 1" + "\n"+
            "010 1" + "\n"+
            "011 1" + "\n"+
            "100 0" + "\n"+
            "101 1" + "\n"+
            "110 1" + "\n"+
            "111 0" + "\n";
}



/**
@example getCellularAutomataFunction()("1","1","1") returns "0"
*/
function getCellularAutomataFunction() {
  let transitionFunctionCode = $('#code').val();
  let transitionFunction = {};
  transitionFunction["   "] = " ";
  for(let line of transitionFunctionCode.split("\n"))
  if(line != "") {
    line = line + "     ";
    transitionFunction[line.substring(0, 3)] = line[4];
  }
  return (l, m, r) => transitionFunction[l+m+r] != undefined ? transitionFunction[l+m+r] : "0";
}



function getCellularAutomataEventModel()
{
  var E = new ActionModel();

  var nKar = "(not (Kpos a r))";
  var nKbr = "(not (Kpos b r))";

  let f = getCellularAutomataFunction();
  let post = new CellularAutomatonPostcondition(f, false);
  let postr = new CellularAutomatonPostcondition(f, true);
  E.addAction("e-3", nKbr, post);
  E.addAction("e-2", nKbr, postr);
  E.addAction("e-1", nKbr,post);
  E.addAction("e0", "((Kpos a r) and (Kpos b r))",post);
  E.addAction("e1", nKar,post);
  E.addAction("e2", nKar, postr);
  E.addAction("e3", nKar,post);

  var intToEvent = (i) => "e" + i;

  for(var i = -1; i <= 1; i++)
    E.addEdge("a", intToEvent(2*i-1), intToEvent(2*i));

  for(var i = -1; i <= 1; i++)
    E.addEdge("b", intToEvent(2*i), intToEvent(2*i+1));

  E.makeReflexiveRelation("a");
  E.makeReflexiveRelation("b");

  E.makeSymmetricRelation("a");
  E.makeSymmetricRelation("b");

  E.setPointedAction("e0");

  return E;
}


function setExampleCellularAutomata() {
  $('#guiExample').html("</br>Input word:</br><input id='inputword' value='01110'></input></br></br>" +
'Cellular automaton transition table:</br>' +
  "<textarea cols=6 rows=15 id='code'>" +
  getRule110CellularAutomataTransitionFunctionText() +
  "</textarea>");

  setResetButtonAction(exampleCellularAutomataReset);

  exampleCellularAutomataReset();


}



function exampleCellularAutomataReset() {
  M = getCellularAutomataInitialEpistemicModel($('#inputword').val());

  actionButtonsInit();
  addExplanation("This example shows how to simulate a 1D cellular automaton into dynamic epistemic logic (see [Lê Cong, Pinchinat, Sch., IJCAI2018]). It provides small undecidable epistemic planning problems. Each possible world represents a cell. The current world is cell n° 0. Agent a imagines cell n° -1 and agent b imagines cell n° 1." +
  "Then, when we go deeper in mental states, we reach worlds for the other cells. In each possile world, both agent a and agent b imagine other possible worlds representing the cells in the neightbor.");

  
     addAction({label: "Step of computation.",
              precondition: "top",
              actionModel: getCellularAutomataEventModel(),
              message:  "Step of computation.",
              saidby: "a"
    });
  
 compute();
 computeButtonsVisibleOrNot();
}




/**
@class A postcondition that transforms a valuation by a set of assignments
* @description the postcondition object corresponding to assignments given in post
* @param: post is an associative array where entries are (proposition formula)
   Formula could be already parsed formula or string that represents the formula.
* @example new CellularAutomatonPostcondition()
* */
class CellularAutomatonPostcondition
{

  constructor(f, putrtrue){
    this.f = f;
    this.putrtrue = putrtrue;
  }

/**
@param M an epistemic modelCheck
@param w an id of a possible world
@returns a world object that is the update of the world of id w by the postcondition
*/
perform(M, w)
{
    var newWorld = clone(M.nodes[w]);

    let leftAgent;
    let rightAgent;

    if(newWorld.modelCheck("r")) {
        leftAgent = "a";
        rightAgent = "b";
    }
    else {
      leftAgent = "b";
      rightAgent = "a";
    }

    let leftSuccs = M.getSuccessors(w,leftAgent);
    let rightSuccs = M.getSuccessors(w,rightAgent);
    let leftWorld = undefined;
    let rightWorld = undefined;
    for(let u of leftSuccs)
      if(u != w)
        leftWorld = M.nodes[u];

    for(let u of rightSuccs)
      if(u != w)
        rightWorld = M.nodes[u];

    let l;
    let r;

    if(leftWorld == undefined) l="0"; else l = leftWorld.value;
    if(rightWorld == undefined) r="0"; else r=rightWorld.value;
    newWorld.value = this.f(l, M.nodes[w].value, r);

    if(this.putrtrue)
        newWorld.propositions["r"] = true;


    return newWorld;
}

    toString() {
        return "f";
    }
}
