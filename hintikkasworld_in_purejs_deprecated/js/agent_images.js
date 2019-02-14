'use strict';

/**
Images of the agents
**/
var agentImages = {};

for(let agent of agents) {
  agentImages[agent] = new Image();
  agentImages[agent].src = "img/agent" + agent + ".png";
  waitThatLoaded(agentImages[agent]);
}



function waitThatLoaded(img) {
    var timeOut = 5*100; //ms
    var start = new Date().getTime();
    while(1)
    if(img.complete || img.naturalWidth || new Date().getTime()-start>timeOut)
        break;
}
agentImages["d"].onload = function() {drawCanvasWorld();};
