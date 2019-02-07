'use strict';

/*
example of use
tableauProver.reset();
tableauProver.addFormula("p");
tableauProver.addFormula("(CK (Kpos a (not p)))");
tableauProver.addFormula("(CK (Kpos a p))");
tableauProver.addFormula("(CK (Kpos b (not p)))");
tableauProver.addFormula("(CK (Kpos b p))");
M = tableauProver.getEpistemicModel();
*/


class TableauProver {
  reset() {  this.formula = undefined; }

  addFormula(formula) {
      if(this.formula == undefined)
          this.formula = formula;
      else {
          this.formula = "(" + this.formula + " and " + formula + ")";
      }
  }
  getEpistemicModel() {
    //((CK (((Kpos a (not p)) and (Kpos b (not p))))) and p)
    let M = mettelResultToEpistemicModel(callMettel2(this.formula));
    return M.contract();
  }
}



let tableauProver = new TableauProver();


function callMettel2(formula) {
   let result = "miaou";
    $.ajax({
        type: "GET",
        url: "mettel2/mettel2.php",
        data: {"formula" : formula},
        async: false,
        success: function(data) {result = data;},
        //fail
    });
    if(result == "miaou")
      throwError("Impossible to call the satisfiability solver Mettel2. You need an internet connection or maybe the server is down.");

    return result;
}


function mettelWorldNameToEpistemicModelWorldName(mettelWorldName) {
  let r =  scheme.prettyprint(mettelWorldName);
  r = r.replace(/ /g, 'E');
  r = r.replace(/\(/g, 'O');
  r = r.replace(/\)/g, 'F');
  return r;
}
/*mettelResultToEpistemicModel("Model: [( @ w p )]")
mettelResultToEpistemicModel("Model: [( @ w ( not p ) ), ( @ w ( Kpos ( a ) p ) ), ( @ w ( ( Kpos ( a ) p ) and ( not p ) ) ), ( @ ( f ( w , ( Kpos ( a ) p ) ) ) p ), ( R ( a ) ( w , ( f ( w , ( Kpos ( a ) p ) ) ) ) ), ( not ( { w = ( f ( w , ( Kpos ( a ) p ) ) ) } ) )]");
*/
function mettelResultToEpistemicModel(mettelResult) {
  if(mettelResult.startsWith("Contradiction") || mettelResult.startsWith("UNSAT"))
  {
    throwError("The specification of the tableau prover is unsatisfiable.");
    return "UNSAT";
  }
  else if(mettelResult == "")
    throwError("Empty output of the satisfiability solver Mettel2. ");
  else {
    mettelResult = mettelResult.substr("Model: ".length);
    mettelResult = mettelResult.replace(/\[/g, '(');
    mettelResult = mettelResult.replace(/,/g, '');
    mettelResult = mettelResult.replace(/\]/g, ')');
    let mettelResultScheme = scheme.parser(mettelResult);

    let M = new EpistemicModel();

    for(let tableauTerm of mettelResultScheme) {
      if(tableauTerm[0] == "@") {
        let worldName = mettelWorldNameToEpistemicModelWorldName(tableauTerm[1]);
        if(M.getNode(worldName) == undefined)
            M.addWorld(worldName, new GenericWorldValuation([]));
        if(typeof tableauTerm[2] === 'string')
          M.getNode(worldName).propositions[tableauTerm[2]] = true;
      }
      else if(tableauTerm[0] == "R") {
        let agent = tableauTerm[1][0];
        let w1 = mettelWorldNameToEpistemicModelWorldName(tableauTerm[2][0]);
        let w2 = mettelWorldNameToEpistemicModelWorldName(tableauTerm[2][1]);
        if(M.getNode(w1) == undefined)
            M.addWorld(w1, new GenericWorldValuation([]));
        if(M.getNode(w2) == undefined)
            M.addWorld(w2, new GenericWorldValuation([]));
        M.addEdge(agent, w1, w2);
      }
    }
    M.setPointedWorld("w");
    return M;
  }
}




function del2mettel(E) {

}



function testDel2Mettel()
{
  let E = new ActionModel();

  E.addEvent("e", {pre: "p"});
  E.addEvent("f", {pre: "top"});

  E.addEdge("a", "e", "f");
  E.addEdge("b", "e", "e");
  E.addEdge("a", "f", "f");
  E.addEdge("b", "f", "f");

  return del2mettel(E);
}
