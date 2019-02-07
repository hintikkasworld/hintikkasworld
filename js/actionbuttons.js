'use strict';

var arrayPreconditionsButton = new Array();

/*Initialize the panel of action buttons*/
function actionButtonsInit()
{
  arrayPreconditionsButton = new Array();
  $('#panelExample').html("");
}

/**
 @param actionFunction: function to execute when the action is performed
 @param label: text displayed in the button
 @param preconditionScheme, formula in Scheme (a string). This button is
 displayed iff the preconditionScheme is true
 @return add such a button to the panel
 */
function addButtonAction(actionFunction, label, preconditionScheme) {
  if(preconditionScheme == undefined)
    preconditionScheme = "top";

  var button = $('<button/>');
  button.click(actionFunction);
  button.addClass("actionButton");
  button.html(textToHTML(label));
  arrayPreconditionsButton.push({precondition: createFormula(preconditionScheme),
                                   DOMelement: button});

  $('#panelExample').append(button);
//  $('#panelExample').append("</br>");
}



function addAction(action) {
   let getActionModel = function() {
            if(typeof action.actionModel === "function")
                return action.actionModel();
            else
                return action.actionModel;
        }  
    
  if(action.precondition == undefined)
         action.precondition = "top";

  if(action.perform == undefined)
        action.perform = () => {performAction(getActionModel());
            if(action.message != undefined && action.saidby != undefined)
                speak(action.saidby, action.message);
        };
  
  var button = $('<button/>');
  button.click(() => {action.perform(); hideActionModel();});
  button.mouseenter(() => {if(action.actionModel) showActionModel(getActionModel())});
  button.mouseout(hideActionModel);
  button.addClass("actionButton");
  button.html(textToHTML(action.label));
  arrayPreconditionsButton.push({precondition: createFormula(action.precondition),
                                   DOMelement: button});

  $('#panelExample').append(button);
    
}




/**
 @param label: explanation to be added
 @param preconditionScheme, formula in Scheme (a string). This explanation is
 displayed iff the preconditionScheme is true
 @return add a div to the panel that displays the explanation
 */
function addExplanation(label, preconditionScheme)
{
  if(preconditionScheme == undefined)
    preconditionScheme = "top";

  var div = $('<div/>');
  div.addClass("explanation");
  div.html(textToHTML(label));
  arrayPreconditionsButton.push({precondition: createFormula(preconditionScheme),
                                   DOMelement: div});

  $('#panelExample').append(div);
}

/**
@description change the action of the reset button.
@param actionFunction fonction to be triggered when clicking on the reset button
*/
function setResetButtonAction(actionFunction)
{
  var button = $('#resetButton');
  button.off("click");
  button.click(actionFunction);
  
  button.off("click");
  button.click(actionFunction);
}

/**
   @description refresh the panel of buttons with respect to the preconditions.
*/
function computeButtonsVisibleOrNot()
{
    for(let preconditionButton of arrayPreconditionsButton)
        if(M.modelCheck(M.getPointedWorld(), preconditionButton.precondition))
               preconditionButton.DOMelement.show();
        else
               preconditionButton.DOMelement.hide();

    for(let a of agents) {
        $(".textagent" + a).bind("mousemove", () => agentHighlight(a));
        $(".textagent" + a).bind("mouseout", agentNoHightlight);
    }

}








function textToHTML(text) {
  for(let firstLetter of ['A', 'a'])
  for(let contextEnd of [' ', ',', '.', ':', ';', ')'])
  for(let a of agents) {
    let contextEndExpr = contextEnd;
    if(contextEndExpr == ".")
          contextEndExpr = "\\.";
    if(contextEndExpr == ")")
          contextEndExpr = "\\)";
    text = text.replace(new RegExp(firstLetter + "gent " + a + contextEndExpr, "g"), '<div class="textagent' + a + '">' + firstLetter + 'gent ' + a + '</div>' + contextEnd);
  }


  text = text.replace(/agents a and b/g, 'agents <div class="textagenta">a</div> and <div class="textagentb">b</div>');
  text = text.replace(/Agents a, b and c/g, 'Agents <div class="textagenta">a</div>, <div class="textagentb">b</div> and <div class="textagentc">c</div>');
  return text;
}
