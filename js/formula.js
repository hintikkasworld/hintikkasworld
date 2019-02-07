'use strict';


/**
 * @param schemeExpression a string representing a scheme expression of the formula
 * @return the formula whose expression is schemeExpression
 * @example createFormula("(not p)"), createFormula("(K a (not p))")
 * */
function createFormula(schemeExpression)
{
    let formula = scheme.parser(schemeExpression);
    formulaCheckSyntax(formula);
    return formula;
}


/**
@param a formula (internal representation of a formula)
@return a string that represents the formula
@example formulaPrettyPrint(["not", "p"])
 * */
function formulaPrettyPrint(formula)
{
    return scheme.prettyprint(formula);
}



/**
* @param proposition a string for an atomic proposition
  @param value 0 or 1
  @returns the litteral proposition if value 1 and the litteral "negation of proposition" if value = 0
  @example createLitteral("p", 1) returns "p"
  @example createLitteral("p", 0) returns ["not", "p"]
*/
function createLitteral(proposition, value)
{
    if(value == 1)
	return proposition;
    else
	return ["not", proposition];
}




function createConjunction(f1, f2)
{
  if(typeof(f1) == "string")
    f1 = createFormula(f1);

  if(typeof(f2) == "string")
      f2 = createFormula(f2);

    return [f1, "and", f2];
}











function formulaCheckSyntax(phi) {
  if(phi instanceof Array)
  {
      if(phi.length == 0)
           throwError("Construction '()' is not allowed!");

      if(phi[0] == "not") {
        if(phi.length == 1)
          throwError("Construction '(not)' is not allowed! You should put a formula to negate. E.g. '(not p)'.");
        if(phi.length > 2)
          throwError("You should put a single formula to negate. E.g. '(not p)'. Constructions such as '(not X Y Z)' are not allowed.");

        formulaCheckSyntax(phi[1]);
      }
      else
      if(phi[1] == "or" || phi[1] ==  "xor" || phi[1] == "and" || phi[1] == "&")
      {
            if(phi.length % 2 == 0)
                  throwError("Your " + phi[1] + "-expression is incorrect. It should be of the form: (X " + phi[1] + " Y), (X " + phi[1] + " Y " + phi[1] + " Z), etc." );

            for(var i = 0; i < phi.length; i+=2)
                  formulaCheckSyntax(phi[i]);

            for(var i = 1; i < phi.length; i+=2)
                  if(phi[i] != phi[1])
                        throwError("You seem to have started a " + phi[1] + "-expression, but I found a '" + phi[i] + "'.");



      }
      if(phi[1] == "<->" || phi[1] == "equiv" || phi[1] == "imply" || phi[1] == "->") {
        if(phi.length != 3)
                throwError("Your " + phi[1] + "-expression should be of the form (X " + phi[1] + " Y)");

        formulaCheckSyntax(phi[0]);
        formulaCheckSyntax(phi[2]);
      }
      else
      if((phi[0] == "Kpos") || (phi[0] == "knowpos") || (phi[0] == "diamond") || (phi[0] == "<>") ||
          (phi[0] == "K") || (phi[0] == "know") || (phi[0] == "box") || (phi[0] == "[]") ||
          (phi[0] == "Kw") || (phi[0] == "knowwhether"))
      {
            let agent;
            let psi;

            if(phi.length == 3) {
              agent = phi[1];

              if(!isAgent(agent))
                throwError("The second argument " + agent + " of " + scheme.prettyprint(phi) + " should be an agent. " + ERROR_AGENT_EXPLANATION);
              psi = phi[2];
            }
            else {
               throwError("You constructed a formula starting with " + phi[0] + " has " + (phi.length-1) + " arguments but it should have 2 arguments. The first argument should be an agent and the second argument should be a formula.");
            }

            formulaCheckSyntax(psi);
      }

  }
}



function isFormulaKnowThat(phi) {
  return (phi[0] == "K") || (phi[0] == "know") || (phi[0] == "box") || (phi[0] == "[]");
}


function isFormulaKnowPosThat(phi) {
  return (phi[0] == "Kpos") || (phi[0] == "knowpos") || (phi[0] == "diamond") || (phi[0] == "<>");
}

function isFormulaKnowWhether(phi) {
  return (phi[0] == "Kw") || (phi[0] == "knowwhether");
}
function getFormulaAgent(phi) {
  let agent;
  let psi;
  if(phi.length == 2)
    return "a";
  else if(phi.length == 3)
    return phi[1];
}


function getFormulaSubFormula(phi) {
  if(phi.length == 2)
    return phi[1];
  else if(phi.length == 3)
    return phi[2];
}
