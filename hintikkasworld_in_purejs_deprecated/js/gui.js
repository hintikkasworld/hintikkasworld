'use strict';

let openWorlds = [];
/*
 if openWorld = [], no thoughts are shown
 if openWorld = [{world: "w", agent: "a"}], the real world is w and the GUI shows the thoughts of agent a
 if openWorld = [{world: "w", agent: "a"}, {world: "u", agent: "b"}], then the real world is w, the GUI shows the thouhts of agent a, in which
       there is a possible world u where we show the thoughts of agent b.
*/
let canvasFromWorld = new Array();


let canvasWorldStandardWidth = 128;

let zoomWorldCanvasInBubble = 1;
let levelheight = zoomWorldCanvasInBubble * canvasWorldStandardWidth + 40; //170


let getMaxLevelWidth = () => 480;
let getYLevelBulle = (level) => canvasRealWorldTop-level*levelheight;




/**
@description draw a circle center x, y and radius r
*/
function circle(x, y, r) {
  let circleElement = $("<div>");
  circleElement.addClass("bullethought");
 $("#canvas-wrap").append(circleElement);
 circleElement.css({left: x-r,
                         width: 2*r,
                         height: 2*r,
                         top: y-r,
                         position:'absolute'});
}

/**
@description draw thinking circles (like in comics)
*/
function drawThinkingCircles(x1, y1, x2, y2) {
  let yShift = 80;
  y1 += yShift;
  y2 += yShift;
  let pas = 20;
  let imax = (y1-y2) / pas;

  let y = y1;
  let r = 5;
  for(let i = 0; i <= imax; i++) {
      let x = x1 + (i * (x2-x1)) / imax;

      if(y-r < y2) return;
      circle(x, y, r);
      y -= pas;
      r += 6;
  }
}

/**
@returns the context object of a canvas (the context is the object on which we can draw)
*/
function getContext(canvas) {
  let context = canvas.getContext('2d');
  context.setTransform(1, 0, 0, 1, 0, 0);
  let ratio = getWorldZoomFactor(canvas);
  context.scale(ratio, ratio);
  return context;
}

/**
@returns the coordinates of element in canvas-wrap
*/
var cumulativeOffset = function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        top -= element.scrollTop  || 0;
        left -= element.scrollLeft || 0;
        element = element.offsetParent;
    } while(element != document.getElementById("canvas-wrap"));

    return {x: left, y: top};
};


/**
@param level level of nesting
@param worldID ID of a world in the Kripke model
@returns the coordinates of the world of ID worldID at level
*/
function getWorldPosition(level, worldID) {
    return cumulativeOffset(canvasFromWorld[level][worldID]);
}

/**
@returns a new canvas
*/
function getNewCanvas() {
  var canvas = document.createElement('canvas');
  canvas.id     = "CursorLayer";
  canvas.width  = canvasWorldStandardWidth * zoomWorldCanvasInBubble;
  canvas.height = canvasWorldStandardWidth * zoomWorldCanvasInBubble/2;
  canvas.style.zIndex   = 8;
  canvas.style.position = "relative";
  canvas.style.margin = "2px 5px 5px 5px";
  canvas.className = "canvasWorld";
  return canvas;
}



function getWorldZoomFactor(canvasWorld) {
  return canvasWorld.width/canvasWorldStandardWidth;
}




function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left)  / getWorldZoomFactor(canvas),
    y: (evt.clientY - rect.top)  / getWorldZoomFactor(canvas)
  };
}

/**
@param level level of the world
@param canvasWorld canvas of the world
@param worldID ID of the world
@returns the event that is triggered with clicking on canvasWorld. This event closes all
 levels > level. Then if the user clicks on an agent, it opens her thoughts.
*/
function modifyOpenWorldsClick(level, canvasWorld, worldID) {
    return function(evt) {
        openWorlds = openWorlds.slice(0, level);
        var point = getMousePos(canvasWorld, evt);
        for(let a of agents)
        if((canvasWorld.id != "canvasRealWorld") || (agentPerspective == undefined) || (a == agentPerspective) ){
            if(M.getNode(worldID).getAgentRectangle(a).isPointIn(point)) {
                openWorlds.push({world: worldID, agent: a});
                compute(level);
                return true;
            }
        }
        compute(level);
    }
}





/**
@description unravel the thoughts of agents so that to show the shortest path to
sourceWorldID from the real world
*/
function showWorld(sourceWorldID)
{
  let path = M.getShortestPath(M.getPointedWorld(), sourceWorldID);

  if(path == undefined) return;

  openWorlds = [];
  let world = M.getPointedWorld();

  for(let step of path) {
      openWorlds.push({world: world, agent: step.agent});
      world = step.world;
  }

  compute(0);
  $(canvasFromWorld[path.length][sourceWorldID]).addClass("currentWorld");
  checkIfInView($(canvasFromWorld[path.length][sourceWorldID]));
  window.setTimeout(function() {$(canvasFromWorld[path.length][sourceWorldID]).removeClass("currentWorld");},300);
}

/**
@description make so that DOM element element is shown
*/
function checkIfInView(element) {
  let parent = element.parent();

  var offset = element.offset().top + parent.scrollTop();

      var height = element.innerHeight();
      var offset_end = offset + height;
      if (!element.is(":visible")) {
          element.css({"visibility":"hidden"}).show();
          var offset = element.offset().top;
          element.css({"visibility":"", "display":""});
      }

      var visible_area_start = parent.scrollTop();
      var visible_area_end = visible_area_start + parent.innerHeight();

      if (offset-height < visible_area_start) {
          parent.animate({scrollTop: offset-height}, 600);
          return false;
      } else if (offset_end > visible_area_end) {
          parent.animate({scrollTop: parent.scrollTop()+ offset_end - visible_area_end }, 600);
          return false;

      }
      return true;
}






function tooltipHandle(evt) {
  let point = getMousePos($('#canvasRealWorld')[0], evt);
  let worldID = M.getPointedWorld();
  for(let a of agents) {
      if(M.getNode(worldID).getAgentRectangle(a).isPointIn(point)) {
          tooltipShow(evt, "agent " + a);
          return;
      }
  }
  tooltipHide();
}



let onRealWorldClick = (evt) => {};


function setOnRealWorldClick(f) {
    onRealWorldClick = f;
}


/**
@description initialize the GUI
*/
function initGUI()
{
  $('#explanationGUI').css({top: 150, left: 50 });
  $('#canvasRealWorld').css({top: 250, left: $('#canvas').width()/2 - $('#canvasRealWorld').width()/2 });

  $('#canvasRealWorld').unbind();

  $('#canvasRealWorld').bind('mousemove',
        function(evt) {
          tooltipHandle(evt);
          graphNodeHighlight(M.getPointedWorld());
        } );

  $('#canvasRealWorld').bind('mouseout', () => tooltipHide());

  $('#canvasRealWorld').bind("click",
         (evt) => {if(!modifyOpenWorldsClick(0, $('#canvasRealWorld')[0], M.getPointedWorld())(evt)) { var point = getMousePos($('#canvasRealWorld')[0], evt); onRealWorldClick(point)}});

  $('#canvasBackground').mousemove( () => graphNodeNoHighlight());

  $('#canvasBackground').click( function() {
       openWorlds = []; compute(0)}
     );

}




$().ready(initGUI);









/**
@description make the GUI to show an error
*/
function guiError()
{
    openWorlds = [];
  //  graphClear();

    $('#canvasRealWorld')[0].draw = () => 0;
    $('#canvasRealWorld').hide();
    $('#explanationGUI').hide();

    closeLevelsGreaterThan(0);

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
}



/**
close levels that are strictly greater than fromlevel
*/
function closeLevelsGreaterThan(level) {
  level++;
  while($('#level' + level).length > 0) {
    $('#level' + level).remove();
    level++;
  }
}


/**
@param level number of the level
@description add a <div> to be fullfilled with possible worlds for a given agent
*/
function addLevelDiv(level) {
    $('#level' + level).remove();

    let levelDiv = $("<div>");
    levelDiv.attr('id', "level" + level);
    levelDiv.addClass("bulle");

    let levelDivContent = $("<div>");
    levelDivContent.attr('id', "level-content" + level);
    levelDivContent.addClass("worldcontainer");
    levelDiv.append(levelDivContent);

    $("#canvas-wrap").append(levelDiv);
}


/**
@param level number of the level
@param worlds an array of worlds ID
@description it fills the GUI level with images of worlds in worlds
*/
function levelFillWithWorlds(level, worlds)
{

  let levelContainer = $('#level-content' + level);

  canvasFromWorld[level] = {};
  levelContainer.empty();

  if(worlds.length == 0)
    $('#level' + level).addClass("error");
  else
    $('#level' + level).removeClass("error");

  let firstSuccessor = true;
  for(let u of worlds) {
        if(!firstSuccessor)
          levelContainer.append('<div class="orBetweenWorlds"> or </div>');

        let canvasWorld = getNewCanvas();
        canvasFromWorld[level][u] = canvasWorld;
        levelContainer.append(canvasWorld);

        canvasWorld.draw = () => {
          let context = getContext(canvasWorld);
          M.getNode(u).draw(context);
          drawModelChecking(u, context);
          };
        canvasWorld.addEventListener('mousemove', () => graphNodeHighlight(u));
        canvasWorld.addEventListener('mouseup',
              modifyOpenWorldsClick(level, canvasWorld, u), false);

        firstSuccessor = false;
    }
}






function levelAdjustPosition(x1, level, expectedLevelWidth) {
    let levelWidth = expectedLevelWidth;

    if(levelWidth > getMaxLevelWidth())
    levelWidth = getMaxLevelWidth();

    let levelLeft = x1 - levelWidth / 2;

    if(levelLeft < 0)
    levelLeft = 0;

    if(levelLeft > $("#canvasBackground").width() - levelWidth)
        levelLeft = $("#canvasBackground").width() - levelWidth;

    $('#level' + level).css({left: levelLeft,
                            width: levelWidth,
                            top: getYLevelBulle(level),
                                    position:'absolute'});
}






let canvasRealWorldTop = 250;


/**
@param fromlevel
@description update the GUI
*/
function compute(fromlevel) {
  if(M.getPointedWorld() == undefined) {
    guiError();
    return;
  }

  $('#canvasRealWorld').show();


  if(fromlevel == undefined) {
       showEpistemicModel(M);
       openWorlds = [];
       fromlevel = 0;
  }

  let shiftY = 0;
  if(openWorlds.length > 1)
      shiftY = (openWorlds.length-1)*levelheight;

  $("#canvasBackground").css({top: -shiftY});
  $("#canvas-wrap").animate({top: shiftY});
  $('#canvasRealWorld').css({top: 250, left: $('#canvasBackground').width()/2 - $('#canvasRealWorld').width()/2 });
  $(".bullethought").remove();

  if(openWorlds.length > 0)
    $('#explanationGUI').hide();


  if(fromlevel == 0) {
         canvasFromWorld[0] = {};
         canvasFromWorld[0][M.getPointedWorld()] = $('#canvasRealWorld')[0];
         canvasFromWorld[0][M.getPointedWorld()].draw = () =>
          {
            let context = getContext(document.getElementById("canvasRealWorld"));
            
            let idNode;
            if(agentPerspective == undefined)
                idNode = M.getPointedWorld();
            else {
                let successors = M.getSuccessors(M.getPointedWorld(), agentPerspective);
                idNode = getRandomElementInArray(successors);
            }
            
            M.getNode(idNode).draw(context);
            drawModelChecking(idNode, context);
          }


  }

  closeLevelsGreaterThan(fromlevel);

  var level = 0;
  for(var worldagent of openWorlds) {
      level++;

      var u = worldagent.world;

      var y = getYLevelBulle(level);
      var x1 = getWorldPosition(level-1, u).x;
      var y1 = getWorldPosition(level-1, u).y;

      let factor = getWorldZoomFactor(canvasFromWorld[level-1][u]);
      x1 += factor * (M.getNode(u).getAgentRectangle(worldagent.agent).x1
                 + M.getNode(u).getAgentRectangle(worldagent.agent).w/2);

      y1 += factor * (M.getNode(u).getAgentRectangle(worldagent.agent).y1
                + M.getNode(u).getAgentRectangle(worldagent.agent).h/2) - 96;

      drawThinkingCircles(x1, y1, x1, y);

      if(level > fromlevel) {
            let successors = M.getSuccessors(worldagent.world, worldagent.agent);
              addLevelDiv(level);
              levelFillWithWorlds(level, successors);
              levelAdjustPosition(x1, level, successors.length * getCanvasWorldInBubbleWidth()+64);
          }
      //    else
        //      $('#level' + level).css({top: getYLevelBulle(level)});

  }
  drawCanvasWorld();

}






function getCanvasWorldInBubbleWidth() {
    return canvasWorldStandardWidth * zoomWorldCanvasInBubble;
}







function drawCanvasWorld()
{
    $(".canvasWorld").each(function () {
      let context = this.getContext('2d');

      context.beginPath();
      context.moveTo(0,0);
      context.lineTo(80+64,0);
      context.lineTo(80+64+16, 64);
      context.lineTo(-16, 64);
      context.clearRect(0, 0, this.width, this.height);

      if(this.draw != undefined)
               this.draw(this);
    });
}

function loop() {
      drawCanvasWorld();
      setTimeout(loop, 200);
}


/**
 @param openWorlds: list of "possible worlds"
 @returns the new list of possible worlds that are shown, after the execution
of an action.
*/
function getOpenWorldsAfterAction(lastOpenWorlds) {

    function pickACompatibleWorld(lastWorldID, worlds) {
      for(let w of worlds) {
        if(M.getNode(w).lastWorldID == lastWorldID)
            return w;
      }
      return undefined;
    }

    var openWorlds = [];
    var worlds = [M.getPointedWorld()];

    for(let lastOW of lastOpenWorlds) {
        let worldID = pickACompatibleWorld(lastOW.world, worlds);

        if(worldID == undefined)
          return openWorlds;

        openWorlds.push( {world: worldID, agent: lastOW.agent});

        worlds = M.getSuccessors(worldID, lastOW.agent);
    }

    return openWorlds;

}




/**
  @param action model E
  @returns execute action "e" of E
*/
function performAction(E) {
  let M2 = product(M, E);

  M2.removeUnReachablePartFrom(M2.getPointedWorld());
  M2 = M2.contract();
//  $( "#canvasRealWorld" ).effect( "shake" );
  M = M2;
  openWorlds = getOpenWorldsAfterAction(openWorlds);
  updateOnChangeKripkeModel();
  
}


function updateOnChangeKripkeModel() {
    showEpistemicModel(M);
    modelCheckingReset();
    updateAgentPerspectiveSet();
    compute(0);
    computeButtonsVisibleOrNot();
}

function performAnnouncement(announcementSchemeExpression) {
  if(announcementSchemeExpression == undefined)
      announcementSchemeExpression = $("#formula").val();

  var E = getActionModelPublicAnnouncement(announcementSchemeExpression);

  performAction(E);
}










function performPrivateAnnouncement(agent, announcementSchemeExpression) {
  if(announcementSchemeExpression == undefined)
      announcementSchemeExpression = $("#formula").val();

  var E = getActionModelPrivateAnnouncement(announcementSchemeExpression, agent);

  performAction(E);
}







