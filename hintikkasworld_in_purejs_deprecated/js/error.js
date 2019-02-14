'use strict';

let errorStack = undefined;




function throwError(message)
{
  throw new Error(message);
}

function getErrorLocation(e)
{
  errorStack = e.stack;

  let panonymous = errorStack.indexOf("<anonymous>:");
  let delta = 12;

  if(panonymous < 0)
  {
    panonymous = errorStack.indexOf("eval:");
    delta = 5;
  }


  let pdoublepointanonymous = errorStack.indexOf(":", panonymous + delta);

  if(panonymous >= 0)
  {
    panonymous += delta;
    return "Line " + errorStack.substr(panonymous, pdoublepointanonymous - panonymous );
  }
  else {
      return "";
  }




}



function errorShowMessage(e)
{
  let msg;

  msg = getErrorLocation(e) + ": " + e;

  $("#error").html(msg);
  $("#error").addClass("error");


}



function noerror()
{
  $("#error").html("");
  $("#error").removeClass("error");


}



let ERROR_AGENT_EXPLANATION = 'An agent is either "a", "b" or "c".';
