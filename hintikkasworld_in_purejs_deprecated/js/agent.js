'use strict';

/**
the list of available agents
*/
let agents = ["a", "b", "c", "d"];


/**
@param a string a
@return true if a is an agent
*/
function isAgent(a) {
    return agents.indexOf(a) > -1;
}

let agentColor = {"a": "#ED5D1B", "b": "#80AAFF", "c":"#72267C", "d":"#008800"};

function getAgentColor(a) {
  return agentColor[a];
}


function getPresentAgents() {
    let presentAgents = [];
    for(let a of agents)
        if(M.getSuccessors(M.getPointedWorld(), a).length > 0)
            presentAgents.push(a);
        
    return presentAgents;
}


function agentHighlight(a) {
  $("#agenthighlight").remove();

  let rectangle = M.getNode(M.getPointedWorld()).getAgentRectangle(a);
  let element = $("<div>");

  element.attr("id", "agenthighlight");
  let worldPos = $("#canvasRealWorld").position();
  let factor = getWorldZoomFactor($("#canvasRealWorld")[0]);
  rectangle.x1 = factor * rectangle.x1;
  rectangle.y1 = factor * rectangle.y1;
  rectangle.w = factor * rectangle.w;
  rectangle.h = factor * rectangle.h;
  let paddingX = 8;
  let paddingY = 8;
  element.css({left:  worldPos.left + rectangle.x1 - paddingX,
                 top: worldPos.top + rectangle.y1 - paddingY,
                 width: rectangle.w+paddingX,
                 height: rectangle.h+paddingY,
                 "border-color": getAgentColor(a),
                 position:'absolute'});
  element.appendTo($("#canvasRealWorld").parent());
}



function agentNoHightlight() {
  $("#agenthighlight").remove();
}
