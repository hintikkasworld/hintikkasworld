'use strict';

/**
@class qdecPOMDP
A Qdec-POMDP
*/
class qdecPOMDP
{
    constructor()
    {
      this.states = new Array();
      this.statesJSONToInt = new Array();
      this.initialStates = new Array();
      this.transitions = new Array();
    }


    /**
    @param q a state (it can be an object)
    */
    addState(q)
    {
        this.statesJSONToInt[JSON.stringify(q)] = this.states.length;
        this.states.push(q);

    }


    getState(id)
    {
        return this.states[id];
    }


    getStates()
    {
      return this.states;
    }


    addInitialState(q)
    {
        this.initialStates.push(this.statesJSONToInt[JSON.stringify(q)]);
    }


    getStates()
    {
      return this.states;
    }


    /**
    @param transition is an object {statebegin: q1, actions: a, observations: o, stateend: q2}
    */
    addTransition(transition)
    {
        transition.statebegin = this.statesJSONToInt[JSON.stringify(transition.statebegin)];
        transition.stateend = this.statesJSONToInt[JSON.stringify(transition.stateend)];

        if(this.transitions[transition.statebegin] == undefined)
            this.transitions[transition.statebegin] = new Array();

        this.transitions[transition.statebegin].push(transition);
    }


    /**
    @param istate
    @returns an array containing transitions starting from istate
    */
    getTransitions(istate)
    {
        if(this.transitions[istate] == undefined)
          return new Array();
        else {
          return this.transitions[istate];
        }
    }

}


/**
@class QdecPOMDPPoliciesWorld
A Qdec-POMDP possible world
*/
class QdecPOMDPPoliciesWorld
{
    constructor(myqdecPOMDP, state, pcs)
    {
      this.myqdecPOMDP = myqdecPOMDP;
      this.state = state;
      this.pcs = pcs;
    }


    modelCheck(p)
    {
        if(p instanceof Array)
        {
            if(p[0] == "state")
              return this.state == p[1];
            else if(p[0] == "pcs" || p[0] == "pc")
              return (this.pcs["a"] == p[1]["a"]) && (this.pcs["b"] == p[1]["b"]);
            else {
              return this.myqdecPOMDP.getState(this.state).modelCheck(p);
            }
        }
        else
        {
            return this.myqdecPOMDP.getState(this.state).modelCheck(p);
        }

    }


    toString() {
      return this.state + ", a:" + this.pcs["a"] + "b: " + this.pcs["b"];
    }


    getShortDescription()
    {
      return this.toString();
    }


    draw(context)
    {

    }

    getAgentRectangle(agentName)
    {

    }

}


var qdecPOMDPEpistemicModelWorldCount = 0;


function qdecPOMDPPoliciesToInitialEpistemicModel(myqdecPOMDP, programCounterGraphs)
{
  let M = new EpistemicModel();

  for(let initialstate of myqdecPOMDP.initialStates)
  {
    M.addWorld("w", new QdecPOMDPPoliciesWorld(myqdecPOMDP, initialstate, {"a": programCounterGraphs["a"].pcinit, "b": programCounterGraphs["b"].pcinit}));
    qdecPOMDPEpistemicModelWorldCount++;
  }
  M.setPointedWorld("w");
  M.makeReflexiveRelation("a");
  M.makeReflexiveRelation("b");
  return M;
}





/**
 event = {statebegin: 2279, transition: {statebegin: 2279, actions: {a: "goToStation", b: "goToStation"},
                observations: {a: true, b: true}, stateend: 2596}, pcbegin: {a: 9, b: 9}, pcend: {"a": 10, "b": 10}}

getQdecPOMDPPoliciesEventName( {statebegin: 2279, transition: {statebegin: 2279, actions: {a: "goToStation", b: "goToStation"},
                observations: {a: true, b: true}, stateend: 2596}, pcbegin: {a: 9, b: 9}, pcend: {"a": 10, "b": 10}})
*/
function getQdecPOMDPPoliciesEventName(event)
{
  //{statebegin: istate, transition: transition, pcbegin: {"a": pca, "b": pcb}, pcend: {"a": nextpca, "b": nextpcb}}
//      return JSON.stringify(event);
  return event.statebegin + "_" + event.transition.actions["a"] + "_" + event.transition.actions["b"] + event.transition.observations["a"] + "_" + event.transition.observations["b"] + "_" + event.pcbegin.a + "_" + event.pcbegin.b + "_" + event.pcend.a + "_" + event.pcend.b;
}


function getQdecPOMDPPoliciesEventPrecondition(event, policies)
{
  var phia = policies["a"].getPrecondition(event.pcbegin["a"]);
  var phib = policies["b"].getPrecondition(event.pcbegin["b"]);
  return [[[["state", event.statebegin], "and", ["pc", event.pcbegin]], "and", phia], "and", phib];
}



function QdecPOMDPPoliciesEventPostcondition(myqdecPOMDP, event)
{
  this.perform = function(M, w) //?
  {
    	return new QdecPOMDPPoliciesWorld(myqdecPOMDP, event.transition.stateend, event.pcend);
  }

}

var qdecPOMDPEventModelEventCount = 0;

function getQdecPOMDPPoliciesEvents(myqdecPOMDP, policies, M)
{
  let events = new Array();
//  for(let istate of myqdecPOMDP.initialStates)// myqdecPOMDP.getStates())
//  for(let pca in policies["a"].getImportantPCs(time))
//  for(let pcb in policies["b"].getImportantPCs(time))
  for(let iworld in M.getNodes())
  {
        let world = M.getNodes()[iworld];
        let istate = world.state;
        let pca = world.pcs["a"];
        let pcb = world.pcs["b"];
        if(policies["a"].getSuccessors(pca) != undefined)
        if(policies["b"].getSuccessors(pcb) != undefined)
        for(let nextpca of policies["a"].getSuccessors(pca))
        for(let nextpcb of policies["b"].getSuccessors(pcb))
        for(let transition of myqdecPOMDP.getTransitions(istate))
        {

          if(policies["a"].getAction(pca) == transition.actions["a"])
          if(policies["b"].getAction(pcb) == transition.actions["b"])
          {
              events.push({statebegin: istate, transition: transition, pcbegin: {"a": pca, "b": pcb}, pcend: {"a": nextpca, "b": nextpcb}});
              qdecPOMDPEventModelEventCount++;
          }
        }
  }


  return events;
}



function qdecPOMDPPoliciesToPointedEventModel(myqdecPOMDP, policies, M)
{
  let E = new ActionModel();
  let initialevents = new Array();
  let world = M.getNodes()[M.getPointedWorld()];
  let events = getQdecPOMDPPoliciesEvents(myqdecPOMDP, policies, M);

  for(let event of events)
  {
      if(event.statebegin == world.state && (event.pcbegin["a"] == world.pcs["a"]) && (event.pcbegin["b"] == world.pcs["b"]))
        initialevents.push(getQdecPOMDPPoliciesEventName(event));
      E.addAction(getQdecPOMDPPoliciesEventName(event), getQdecPOMDPPoliciesEventPrecondition(event, policies), new QdecPOMDPPoliciesEventPostcondition(myqdecPOMDP, event));
  }


  for(let event of events)
  for(let event2 of events)
  for(let a of ["a", "b"])
  if((event.transition.observations[a] == event2.transition.observations[a]))
  {
      E.addEdge(a, getQdecPOMDPPoliciesEventName(event), getQdecPOMDPPoliciesEventName(event2));
  }
  if(initialevents.length == 0)
    console.log("no applicable event found");
  return {E: E, initialevent: initialevents[Math.floor(Math.random() * initialevents.length)]};

}











function getQdecPOMDPNextPointedEpistemicModel(myqdecPOMDP, policies)
{
   let pointedE = qdecPOMDPPoliciesToPointedEventModel(myqdecPOMDP, policies, M);
   let newM = product(M,  pointedE.E);

   if(pointedE.initialevent == undefined)
    return M;


   for(let e of pointedE.E.getSuccessors(pointedE.initialevent, "a"))
   if(pointedE.E.getSuccessors(pointedE.initialevent, "b").indexOf(e) > -1)
   {
     for(let u of M.getSuccessors(M.getPointedWorld(), "a"))
     if(M.getSuccessors(M.getPointedWorld(), "b").indexOf(u) > -1)
     {
        if(M.modelCheck(u, pointedE.E.getPrecondition(e)))
        {
            M.setPointedWorld(u);
            pointedE.initialevent = e;
        }
     }
   }






  newM.setPointedWorld(createWorldActionName(M.getPointedWorld(), pointedE.initialevent));


  newM.removeUnReachablePartFrom(newM.getPointedWorld());

  if(newM.getNodesNumber() == 0)
  {
      console.log("ERROR: no worlds!")
      return M;

  }

  else
    return newM;

}
