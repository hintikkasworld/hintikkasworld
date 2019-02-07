
let graphVisualization = undefined;

$().ready(function() {graphVisualization = new GraphVisualization("#graphVisualizationEpistemicModel"); });



/**
eval the script in the text area #script
*/
function evalScript() {
  try {
    noerror();
    
    if(graphVisualization != undefined) graphVisualization.clear();
    eval(getEditorCode());
  } catch (e) {
    errorShowMessage(e);
    if(graphVisualization != undefined) graphVisualization.clear();
  } finally { }
}







