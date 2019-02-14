'use strict';

var exampleMuseumBackgroundImg = new Image();
exampleMuseumBackgroundImg.src = "img/qdecpomdpmuseum.png";

var exampleMuseumRainImg = new Image();
exampleMuseumRainImg.src = "img/rain.png";

var exampleMuseumMuddyImg = new Image();
exampleMuseumMuddyImg.src = "img/muddy.png";

var exampleMuseumWetmg = new Image();
exampleMuseumWetmg.src = "img/wet.png";


var agentY = 10;
var objectsY = 38;

var mud = new Image();
mud.src = "img/mud.png";




let ParkStateEnum =
{
   DRY: "DRY",
   WET: "WET",
   MUDDY: "MUDDY",
}

let PlaceEnum =
{
   HOME: "HOME",
   HALFWAYHOMEMUSEUM: "HALFWAYHOMEMUSEUM",
   MUSEUM: "MUSEUM",
   OUTSIDEMUSEUM: "OUTSIDEMUSEUM",
   RIVERSIDE: "RIVERSIDE",
   PARK: "PARK",
   STATION: "STATION"
}

let actionsEnum =
{
  goToMuseum: "goToMuseum",
  enjoy: "enjoy",
  exitMuseum: "exitMuseum",
  goToRiverside: "goToRiverside",
  goToPark: "goToPark",
  goToStation: "goToStation"
}


var exampleMuseumTMax = 16;

function createQDECPOMDPMuseum()
{
  let QDECPOMDPMuseum = new qdecPOMDP();

  for(let t = 0; t <= exampleMuseumTMax; t++)
  for(let r of [false, true])
  for(let parkstate in ParkStateEnum)
  for(let agentaplace in PlaceEnum)
  for(let agentbplace in PlaceEnum)
  {
      let state = {time: t, rain: r, parkstate: parkstate, agentplace: {"a": agentaplace, "b": agentbplace}};
      state.modelCheck = function(p)
      {
          if(p == "wet")
            return this.parkstate == ParkStateEnum.WET;
          if(p == "muddy")
              return this.parkstate == ParkStateEnum.MUDDY;
          if(p == "dry")
                return this.parkstate == ParkStateEnum.DRY;
      }
      QDECPOMDPMuseum.addState(state);
  }


  for(let state of QDECPOMDPMuseum.getStates()) {
      if(state.time < exampleMuseumTMax) {
          for(let actiona in actionsEnum)
          for(let actionb in actionsEnum)
          for(let  r2 of [false, true])
          if(!state.rain || r2) //if it is raining then it is still raining
          {
              let parkstate2 = state.parkstate;

              if(state.rain)
              {
                if(state.parkstate == ParkStateEnum.DRY)
                  parkstate2 = ParkStateEnum.MUDDY;

                if(state.parkstate == ParkStateEnum.MUDDY)
                    parkstate2 = ParkStateEnum.WET;
              }

              let action = {"a": actiona, "b": actionb};
              let isTransitionAdded = true;

              var state2 = {time: state.time, rain: r2, parkstate: parkstate2, agentplace: {"a": state.agentplace["a"], "b": state.agentplace["b"]}};
              state2.time++;


              let o = {"a": r2, "b": r2};
              for(let a of ["a", "b"])
              {
                  if(action[a] == actionsEnum.goToMuseum)
                  {
                    if(state.agentplace[a] == PlaceEnum.HOME)
                    {
                      state2.agentplace[a] = PlaceEnum.HALFWAYHOMEMUSEUM;
                    }
                    else
                    if(state.agentplace[a] == PlaceEnum.HALFWAYHOMEMUSEUM)
                    {
                      state2.agentplace[a] = PlaceEnum.MUSEUM;
                    }
                    else {
                      isTransitionAdded = false;
                    }
                  }

                  if(action[a] == actionsEnum.exitMuseum)
                  {
                    if(state.agentplace[a] == PlaceEnum.MUSEUM)
                    {
                        state2.agentplace[a] = PlaceEnum.OUTSIDEMUSEUM;
                    }
                    else {
                      isTransitionAdded = false;
                    }
                  }

                  if(action[a] == actionsEnum.goToRiverside)
                  {
                    if(state.agentplace[a] == PlaceEnum.HOME)
                    {
                      state2.agentplace[a] = PlaceEnum.RIVERSIDE;
                    }
                    else {
                      isTransitionAdded = false;
                    }
                  }

                  if(action[a] == actionsEnum.goToPark)
                  {
                    if(state.agentplace[a] == PlaceEnum.OUTSIDEMUSEUM || state.agentplace[a] == PlaceEnum.RIVERSIDE)
                    {
                      state2.agentplace[a] = PlaceEnum.PARK;
                    }
                    else {
                      isTransitionAdded = false;
                    }
                  }

                  if(action[a] == actionsEnum.goToStation)
                  {
                    if(state.agentplace[a] == PlaceEnum.RIVERSIDE || state.agentplace[a] == PlaceEnum.OUTSIDEMUSEUM)
                    {
                      state2.agentplace[a] = PlaceEnum.STATION;

                    }
                    else {
                      isTransitionAdded = false;
                    }

                  }

                  if(action[a] == actionsEnum.enjoy)
                  {
                    if(state.agentplace[a] == PlaceEnum.RIVERSIDE || state.agentplace[a] == PlaceEnum.MUSEUM)
                    {
                    }
                    else {
                      isTransitionAdded = false;
                    }

                    if(state.agentplace[a] == PlaceEnum.MUSEUM)
                        o[a] = "void";
                  }
              }

          //    if(isTransitionAdded)
              {
                QDECPOMDPMuseum.addTransition({statebegin: state, actions: action, observations: o, stateend: state2});
              }



          }

      }

  }





  let initialstate = {time: 0, rain: false, parkstate: ParkStateEnum.DRY, agentplace: {"a": PlaceEnum.HOME, "b": PlaceEnum.HOME}};
  QDECPOMDPMuseum.addInitialState(initialstate);
  return QDECPOMDPMuseum;


}



let exampleMuseumAgentRadius = 8;

function prototypeWorldForMuseum(world)
{

  world.agentPos = {};
  world.agentPos["a"] = {x: 0, y:0};
  world.agentPos["b"] = {x: 0, y:0};
  world.t = 0;

  world.draw = function(context)
  {
    let state = qDECPOMDPMuseum.getState(world.state);

    context.drawImage(exampleMuseumBackgroundImg, 0, 0, 128, 64);
    this.agentPos["a"] = {x: 0, y:0};
    world.agentPos["b"] = {x: 0, y:0};


    for(let a of ["a", "b"])
    {
      let pos;
        switch(state.agentplace[a])
        {
            case PlaceEnum.HOME: pos = {x: 100, y: 33}; break;
            case PlaceEnum.HALFWAYHOMEMUSEUM: pos = {x: 90, y: 12}; break;
            case PlaceEnum.MUSEUM: pos = {x: 53, y: 12}; break;
            case PlaceEnum.OUTSIDEMUSEUM: pos = {x: 53, y: 13}; break;
            case PlaceEnum.PARK: pos = {x: 48, y: 43}; break;
            case PlaceEnum.STATION: pos = {x: 12, y: 38}; break;
            case PlaceEnum.RIVERSIDE: pos = {x: 95, y: 56}; break;

        }
        world.agentPos[a] = pos;
        if(a == "b")
          world.agentPos[a].x += 2*exampleMuseumAgentRadius;

    }

    for(let a of ["a", "b"])
          context.drawImage(agentImages[a], world.agentPos[a].x-exampleMuseumAgentRadius, world.agentPos[a].y-exampleMuseumAgentRadius, 2*exampleMuseumAgentRadius, 2*exampleMuseumAgentRadius);


    if(state.parkstate == ParkStateEnum.MUDDY)
    {
      context.drawImage(exampleMuseumMuddyImg, 48, 43, 24, 24);
    }
    else
    if(state.parkstate == ParkStateEnum.WET)
    {
      context.drawImage(exampleMuseumWetmg, 48, 43, 24, 24);
    }


    if(state.rain)
    {
        if(world.t < 8)
             context.drawImage(exampleMuseumRainImg, 0, 0, 128, 64);
          else {
                 context.drawImage(exampleMuseumRainImg, 16, 16, 128, 64);
          }
        world.t++;

        if(world.t > 16)
          world.t = 0;
    }

    /*if(world.t)
        world.t = 0;
      else {
        world.t = 1;
      }*/



  }

  world.getAgentRectangle = function(agentName)
  {
      if(world.agentPos[agentName] == undefined)
        return new Rectangle(160, 160, 0, 0);
      else
      return new Rectangle(world.agentPos[agentName].x-exampleMuseumAgentRadius, world.agentPos[agentName].y-exampleMuseumAgentRadius, exampleMuseumAgentRadius*2, exampleMuseumAgentRadius*2);
  }
}



function prototypeWorldsForMuseum(M)
{
  for(var i in M.getNodes())
      prototypeWorldForMuseum(M.getNodes()[i]);
}


let qDECPOMDPMuseum;

function setExampleQDECPOMDPMuseum()
{


  let pcgrapha;
  let pcgraphb;


  function exampleMuseumReset()
  {
    let kbpa = createKnowledgeBasedProgram($("#kbpa").val());
    let kbpb = createKnowledgeBasedProgram($("#kbpb").val());

    pcgrapha = getProgramCounterGraph(kbpa);
    pcgraphb = getProgramCounterGraph(kbpb);

    M = qdecPOMDPPoliciesToInitialEpistemicModel(qDECPOMDPMuseum, {"a": pcgrapha, "b": pcgraphb});
    prototypeWorldsForMuseum(M);
    compute();
    computeButtonsVisibleOrNot();
  }











  qDECPOMDPMuseum = createQDECPOMDPMuseum();
  $('#guiExample').html(
    "<table><tr><td><div class='explanation'>Knowledge-based program for agent a:</div><textarea cols=30 rows=20 id='kbpa'>goToMuseum; \ngoToMuseum; \nenjoy; \nenjoy;\nenjoy; \nexitMuseum; \nif('(know a wet)') \n    goToStation; \nelse \n    goToPark;  \nenjoy;</textarea></td>"
+ "<td><div class='explanation'>Knowledge-based program for agent b:</div><textarea cols=30 rows=20  id='kbpb'>goToRiverside; \nenjoy; \nenjoy;\nenjoy;\nenjoy;\nenjoy; \nif('(know b (know a wet))') \n    goToStation; \nelse \n    goToPark;  \nenjoy;</textarea></td></tr></table>");



  actionButtonsInit();

  addExplanation("This example is a current work QdecPOMDP and knowledge-based programs in " +
  "<a href='https://hal.archives-ouvertes.fr/PSL/hal-01646207v1' target='_blank'>[Saffidine, Sch., Zanuttini, AAAI2018]</a>");

  addButtonAction(function() {
        exampleMuseumReset();
         },
        "reset", "top");

        addButtonAction(function() {
                M = getQdecPOMDPNextPointedEpistemicModel(qDECPOMDPMuseum, {"a": pcgrapha, "b": pcgraphb}, M);
                M = M.contract();
                prototypeWorldsForMuseum(M);
                compute();
	              computeButtonsVisibleOrNot();

 	      },
	              "One step", "top");

  exampleMuseumReset();
}
