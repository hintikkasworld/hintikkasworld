'use strict';


let exampleCustomAgentRadius = 16;

function setExampleCustom()
{
  $('#guiExample').html(
'<a target="_blank" href="doc/index.html">Help</a></br>' +
  "<textarea cols=40 rows=30 id='code'>" +
   'tableauProver.addFormula("p");\n' +
   'tableauProver.addFormula("(not (K a p))");\n' +
   "M = tableauProver.getEpistemicModel();" +
  "</textarea>");

  editorInstall("code");
  exampleCustomReset();
  actionButtonsInit();
  setResetButtonAction(exampleCustomReset);
//  addButtonAction(exampleCustomReset, "Set up", "top");

  $('#panelGeneralTool').show();
   compute();
   computeButtonsVisibleOrNot();

}




function exampleCustomReset()
{
  noerror();
  try {
      tableauProver.reset();
      eval(getEditorCode());
  } catch (e) {
    errorShowMessage(e);
    guiError();
    return;
  } finally {

  }



    compute();
    computeButtonsVisibleOrNot();


}
