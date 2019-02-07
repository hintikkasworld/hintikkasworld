
let agentPerspective = undefined;

function setExternalPerspective() {
    agentPerspective = undefined;
}

function setInternalPerspective(agent) {
    agentPerspective = agent;
}

function setAgentPerspectiveSet(presentAgents) {
   for(let a of agents)
        $("#labelinternalPerspectiveAgent" + a).hide();
    
    for(let a of presentAgents)
        $("#labelinternalPerspectiveAgent" + a).show();
}


function updateAgentPerspectiveSet() {
    setAgentPerspectiveSet(getPresentAgents());
}
