'use strict';

let nodeRadius = 10;
var distanceBetweenGroups = 120;
let dataset;
let graphVisualizationShowLink = false;
let colorTimeEdge = "#000000";
let optionIsNodeLabelsDrawn = true;
let nodeNumberThreshold = 400; //if exceeded, the graph is not shown

/**
 * @class GraphVisualization
 * @description This class connects a DOM element to a graph.
 * @example graphVisualization = new GraphVisualization("#graphVisualizationEpistemicModel");
 * graphVisualization.showGraph(M);
 * 
 */
class GraphVisualization {
    
    /**
     * @param svgSelector a string that is a selector, e.g. "#graphVisualizationEpistemicModel"
     * @description Attach the graph visualization object to an svg element of the DOM selected via svgSelector
     * */
    constructor(svgSelector) {
        this._svgSelector = svgSelector;
        this.reorderDELstructureSetupInit();
    }
        
    /**
     * @param G is a graphClear
     * @description show the graph G (it clears the previous displayed graph)
     */
    showGraph(G) {
        if(G.getNodesNumber() > nodeNumberThreshold) {
            this.clear();
            $(this._svgSelector).html('<text x="0" y="100" fill="red">The graph contains ' + G.getNodesNumber() + ' nodes and is to big to be displayed.</text>');
        }
        else
             this.showMEstar(G, [G.getPointedNode()], undefined, undefined, 0);
    }
    
    /**
    @param M epistemic modelCheck
    @param W0 set of initial world IDs
    @param E action modelCheck
    @param E0 set of initial event IDs
    @param t = depth
    */
    showMEstar(M, W0, E, E0, t) {
        this._M = M;
        this._savePreviousGraph();
        this.showGraphFromDataSet(this.getDataSetFromMEt(M, W0, E, E0, t), t!=0);
        this._setNodePositionRespectingPreviousGraph();
    }

    
    
    clear() {
          this.previousGraph = undefined; 
          this.SVGclear();
          this.simulation.stop();
    }
    
    
    
    setNodesAreSquares()
    {
        this._NodesAreSquares = true;
    }
    
    /**
    Make that nodes are assigned the coordinates of the corresponding nodes in the previous
    graph
    */
    _setNodePositionRespectingPreviousGraph()  {
        let graphVisualization = this;
        this.getSVG().selectAll("g.node")
            .each(function (d) {
            if(graphVisualization._M.getNode(d.id) == undefined) return;
            let previousID = graphVisualization._M.getNode(d.id).lastWorldID;
            if(previousID == undefined) previousID = d.id;
            let previousGraphInfo =  graphVisualization.previousGraph[previousID];
            if(previousGraphInfo != undefined) {
                if(previousGraphInfo.x != undefined) d.x = previousGraphInfo.x;
                if(previousGraphInfo.y != undefined) d.y = previousGraphInfo.y;
            }
            else {
                d.x += 200;
                d.y += 200;
            }
        });
    }
    
    
    
    
    
    
    
    
    
    
    
    nodesRemoveAllClass() {
        $(".node circle").attr("class", "");
        
    }
    
    
    
    nodesAddClass(className, testFunction) {
        for(let nodeID in this._M.getNodes())
            if(testFunction(nodeID))
                $("#" + getSVGIdFromNodeID(nodeID) + " circle").attr("class", className);
    }

    
    getGraphInformation() {
        let A = {};
        this.getSVG().selectAll("g.node").each((d) => A[d.id] = d);
        return A;
    }


    _savePreviousGraph() {
        this.previousGraph = this.getGraphInformation();
    }

    
    importPositionsFromWithLastWorldID(otherGraphVisualisation) {
        let graphVisualization = this;
        let otherInfos = otherGraphVisualisation.getGraphInformation();
        this.getSVG().selectAll("g.node").each(function(d) {
            d.x = otherInfos[graphVisualization._M.getNode(d.id).lastWorldID].x;
            d.y = otherInfos[graphVisualization._M.getNode(d.id).lastWorldID].y;});
    }

    /**
    @param dataset data of the graph in the D3 format
    @param isManyEpistemicModel true iff there exists multiple epistemic models to display (somehow if the depth is > 0). This value modifies the display.
    */
    showGraphFromDataSet(dataset, isManyEpistemicModel) {
        this.graphD3exit();
        this.SVGclear();
        this.linksTolinksForD3(dataset);

        this._forceSetup(dataset, isManyEpistemicModel);
        this._edgesSetup(dataset);
        this._nodesSetup(dataset);
    }




    datasetAddM(dataset, M, t, W0) {
            optionIsNodeLabelsDrawn = (M.getNodesNumber() <= 60);

            for(let nodeID in M.getNodes()) {
                let description = M.getNode(nodeID).getShortDescription();
                //description = description.slice(0, 40);

                let initial = (W0.indexOf(nodeID) > -1);

                if(t == 0)
                    dataset.nodes.push({"id": nodeID, "label": description, "group": t, "initial": initial});
                else
                    dataset.nodes.push({"id": nodeID, "label": description, "group": t, "initial": initial});
            }


            M.edgesForEach(function(agent, nodeSourceID, nodeTargetID) {
                if(M.isEdge(agent, nodeTargetID, nodeSourceID)) {
                    if(nodeSourceID < nodeTargetID)
                    dataset.links.push({"source": nodeSourceID,
                                        "target": nodeTargetID,
                                        "label": agent,
                                        "doubledirection": true,
                                        "epistemicrelation": true,
                                    "timerelation": false});
                    else if (nodeSourceID == nodeTargetID)
                    {
                    //  if(isLoopDrawn(agent))
                        dataset.links.push({"source": nodeSourceID,
                                        "target": nodeTargetID,
                                        "label": agent,
                                        "loop": true,
                                        "epistemicrelation": true,
                                        "timerelation": false});
                    }
                }
                else
                    dataset.links.push({"source": nodeSourceID,
                                    "target": nodeTargetID,
                                    "label": agent,
                                    "epistemicrelation": true,
                                    "timerelation": false});
            });

    }




    datasetAddEdgesBetweenMlastAndM(dataset, Mlast, M, E) {
            for(let node in Mlast.nodes)
                for(let event in E.nodes)
                if(M.getNode(createWorldActionName(node, event)) != undefined)
                    dataset.links.push({"source": node,
                                        "target": createWorldActionName(node, event),
                                        "label": event,
                                        "epistemicrelation": false,
                                    "timerelation": true});
    }





    getDataSetFromMEt(M, W0, E, E0, tmax) {
        var Mlast = undefined;
        let dataset = {nodes: [], links: []};

        for(let t = 0; t <= tmax; t++) {
            if(t >= 0) {
                this.datasetAddM(dataset, M, t, W0);
                if(Mlast != undefined)
                    this.datasetAddEdgesBetweenMlastAndM(dataset, Mlast, M, E);
                Mlast = M;
            }

            if(t < tmax) {
                M = product(M, E);
                W0 = getTuplesWorldEvent(W0, E0);

                W0 = W0.filter(w => M.getNode(w) != undefined);
                M.removeUnReachablePartFrom(W0);

                this.reorderDELstructureSetupAdd(M);
            }
        }

        this.reorderDELstructureSetupDefineEventModel(E);
        return dataset;
    }








   /* let reorderDELstructureModels = [];
    let reorderDELstructureE = undefined;*/

    reorderDELstructureSetupInit() {
        this.reorderDELstructureModels = [];
    }

    /**
    input: M an epistemic model that is M X E X E ... E
    effect: register M to check order of nodes in the display
    **/
    reorderDELstructureSetupAdd(M) {
        this.reorderDELstructureModels.push(M);
    }


    reorderDELstructureSetupDefineEventModel(E) {
        this.reorderDELstructureE = E;
    }

    reorderDELstructurePerform() {
        if(this.reorderDELstructureModels == undefined)
            return;
            
        if(this.reorderDELstructureModels.length == 0)
            return;

            let A = this.getGraphInformation();

        for(let M of this.reorderDELstructureModels)
        {
            for(let idnode1 in M.getNodes())
            for(let idnode2 in M.getNodes())
            {
                let idnode1parent = getWorldFromWorldAction(idnode1);
                let idnode2parent = getWorldFromWorldAction(idnode2);

                if(A[idnode1] == undefined) {
                console.log(A);
                console.log(idnode1);
                return;
                }

                if(A[idnode1parent] == undefined) {
                console.log(A);
                console.log(idnode1parent);
                return;
                }
            //  try {
                let action1id = getActionFromWorldAction(idnode1);
                let action2id = getActionFromWorldAction(idnode2);

                if((action1id == action2id) ||
                    this.reorderDELstructureE.isEdge("a", action1id, action2id) ||
                    this.reorderDELstructureE.isEdge("a", action2id, action1id) ||
                    this.reorderDELstructureE.isEdge("b", action1id, action2id) ||
                    this.reorderDELstructureE.isEdge("b", action2id, action1id)
                )
                if((A[idnode1parent].x < A[idnode2parent].x) &&
                    (A[idnode1].x > A[idnode2].x))
                        [A[idnode1].x, A[idnode2].x] = [A[idnode2].x, A[idnode1].x];
                /*    }
                    catch(e)
                    {return;}*/

            }
        }
    }









        /**
        put the ID of nodes in dataset
        */
        linksTolinksForD3(dataset) {
            let nodeById = d3.map(dataset.nodes, d => d.id);
            dataset.links.forEach(function(link) {
                var s = link.source = nodeById.get(link.source),
                    t = link.target = nodeById.get(link.target);
            });
            return dataset.links;
        }



    graphD3exit() {
    if(this.nodeEnter != undefined)  this.nodeEnter.exit();
    if(this.link != undefined)  this.link.exit();
    if(this.text != undefined)  this.text.exit();
    if(this.edgelabels != undefined)  this.edgelabels.exit();
    }





    _nodesSetup(dataset) {
    this.nodeEnter = this.getSVG().selectAll("g.node")
        .data(dataset.nodes)//, (d) => d.id)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("id", function(d) {return getSVGIdFromNodeID(d.id);});
        
        if(this._NodesAreSquares) {
            this.nodeEnter.append("rect")
        .attr("width", nodeRadius)
        .attr("height", nodeRadius);
        }
        else {
            this.nodeEnter.append("circle")
                .attr("r", nodeRadius);
        }
      /*  */
        
        
        
        this.nodeEnter.attr("stroke", "black")
        .attr("stroke-width", d => d.initial ? 3 : 1)
        .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
        .on("mousemove", (d) => $("#nodeID").html(d.id))
        .on("mouseout", (d) => $("#nodeID").html(""))
        .on("click", (d) => showWorld(d.id))
        .each(  (d) => d.y = getGroupPositionCenter(d.group).y)
            .append("svg:title")
            .text((d, i) => d.label);


        let graphVisualization = this;
        
        function dragstarted(d) {
            if (!d3.event.active) graphVisualization.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) graphVisualization.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

    this.text = this.getSVG().append("g").attr("class", "labels").selectAll("g")
            .data(dataset.nodes)
        .enter().append("g");

        if(optionIsNodeLabelsDrawn)
        this.text.append("text")
            .attr("x", 14)
            .attr("class", "nodelabel")
            .attr("y", ".31em")
            .style("font-family", "sans-serif")
            .style("font-size", d => labelLengthToFontSize(d.label.length))
            .text(d => d.label);
    }




    arrowsSetup() {
    this.getSVG().append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("stroke", colorTimeEdge)
        .attr("fill", "none")
        .attr("d", "M0,-5L10,0L0,5");


        for(let a of agents)  {
        this.getSVG().append("defs").append("marker")
            .attr("id", "arrow" + a)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("stroke", edgeLabelToColor(a))
            .attr("fill", "none")
            .attr("d", "M0,-5L10,0L0,5");


        }
    }

    _edgesSetup(dataset) {
        this.arrowsSetup();
    //http://stackoverflow.com/questions/39439608/d3-4-0-graph-with-directed-edges-and-labels
    this.link = this.getSVG().append("g")
            .attr("class", "links")
        .selectAll("path")
            .data(dataset.links)
        .enter().append("path")
            .attr("class", "link")
            .attr("stroke-width", function(d) {if(!isAgent(d.label)) return 0.5; if(d.doubledirection) return 2; else return 1.5;})
            .attr("stroke", (d) => edgeLabelToColor(d.label))
            .attr("id", (d, i) => "linkId" + i)
        .style("stroke-dasharray", (d) => isAgent(d.label) ? ("1, 0") : ("3, 3"))
            .attr("fill", "none")
            .attr("marker-end",  function(d) {
            if(isLinkLoop(d) || d.doubledirection)
                return "";
            else if(isLinkTime(d))
                return "url(#arrowa)";
            else
                return "url(#arrow" + d.label + ")";
            }) //add arrow of id "arrow" or "arrowa", "arrowb", etc.


        this.edgelabels = this.getSVG().append("g").attr("class", "labels").selectAll("g")
            .data(dataset.links)
        .enter()
        .append("text")
            .style("font-family", "sans-serif")
            .style("font-size", "0.5em")
            .style("fill", "white")
            .style("stroke", "black")
            .text((d,i) => isLinkTime(d) ? d.label : "");

    }







    _forceSetup(dataset, isManyEpistemicModel) {
    var manyBody = d3.forceManyBody();
    manyBody.strength(-440).distanceMin(256).distanceMax(156);

    var forceEpistemic = d3.forceLink();
    forceEpistemic.links(getEpistemicRelationLinks(dataset.links));
    forceEpistemic.distance(64);
    //forceEpistemic.strength(0.1);

    if(this.simulation != undefined)
        this.simulation.stop();


    this.simulation = d3.forceSimulation(dataset.nodes)
        .force("charge", manyBody)
        .force("linkEpistemic", forceEpistemic)

    //simulation.stop();

        if(isManyEpistemicModel) {
            var forceY = d3.forceY(function (d) {return getGroupPositionCenter(d.group).y;})
            forceY.strength(function (d) {return 0.1;})
            this.simulation.force("y", forceY);

            var forceTime = d3.forceLink();
            forceTime.links(getTimeRelationLinks(dataset.links));
            forceTime.distance(function(d) {if(Math.abs(d.source.x - d.target.x) < 50) return getDistanceLink(d); else return distanceBetweenGroups;});
            forceTime.strength(function(d) {if(Math.abs(d.source.x - d.target.x) < 50) return 0; else return 0.5;});
            this.simulation.force("linkTime", forceTime);
        }


        this.simulation.on("tick", updateNetwork);
        let graphVisualization = this;
        
        function updateNetwork(e) {
            graphVisualization.getSVG().selectAll("g.node")
            .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");

            //if(Math.random() < 0.2) graphVisualization.reorderDELstructurePerform();

            graphVisualization.getSVG().selectAll("text")
            .attr("transform", function (d) {
                if(d.x == undefined) //label of an edge
                    return "translate(" + (d.source.x + d.target.x)/2 + "," + (d.source.y + d.target.y)/2 + ")";
                else  //label of a node
                    return "translate(" + d.x + "," + d.y + ")";
                });

            graphVisualization.getSVG().selectAll("line")
            .attr("x1",  (d) => d.source.x)
            .attr("y1",  (d) => d.source.y)
            .attr("x2",  (d) => d.target.x)
            .attr("y2",  (d) => d.target.y);


            graphVisualization.getSVG().selectAll(".link").attr("d", function(d) {
                if(isLinkTime(d)) {
                    return "M" + d.source.x + "," + d.source.y + "L" +
                            d.target.x + "," + d.target.y;
                }
                else {
                let factorCurve = {"a": 1, "b":1.8, "c":2.6};
                var x1 = d.source.x;
                var y1 = d.source.y;
                var x2 = d.target.x;
                var y2 = d.target.y;

                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy)*factorCurve[d.label];

                if ( dx ==0 && dy == 0 ) {
                        let factorCurve = {"a": 1, "b":1, "c":1.3};
                        let xRotation = 0;

                        // Needs to be 1.
                        let largeArc = 1;
                        let sweep;

                        // Change sweep to change orientation of loop.
                        if(d.label == "a") sweep = 0;  else  sweep = 1;

                        // Make drx and dry different to get an ellipse
                        // instead of a circle.
                        let drx = 8*factorCurve[d.label];
                        let dry = 8*factorCurve[d.label];

                        // For whatever reason the arc collapses to a point if the beginning
                        // and ending points of the arc are the same, so kludge it.
                        x2 = x2 + 1;
                        y2 = y2 + 1;

                        return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " "
                        + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
                    }
                    return "M" + d.source.x + "," + d.source.y + "A" +
                            dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                }
        });

        graphVisualization.setViewPort();
        }
    }



    /**
    set the viewport so that all nodes are visible
    */
    setViewPort()
    {
        let xmin = 10000;
        let ymin = 10000;
        let xmax = 0;
        let ymax = 0;

        this.getSVG().selectAll("g.node")
            .each(function (d) {
            xmin = Math.min(d.x - 2*nodeRadius, xmin);
            ymin = Math.min(d.y - 2*nodeRadius, ymin);
            xmax = Math.max(d.x + 2*nodeRadius+100, xmax);
            ymax = Math.max(d.y + 2*nodeRadius, ymax);
            });

        this.getSVG().selectAll("g.node").each(function (d) { d.x = d.x - xmin; });

        let viewPortWidth = (xmax-xmin);
        let viewPortHeight = (ymax-ymin);

        if(viewPortWidth < this.getSVGWidth()/2)
            viewPortWidth = this.getSVGWidth()/2;

        if(viewPortHeight < this.getSVGHeight()/2)
            viewPortHeight = this.getSVGHeight()/2;

            let viewBox = xmin + " " + ymin + " " + viewPortWidth  + " " + viewPortHeight;
            //console.log(viewBox);
        
   $(this._svgSelector).width(viewPortWidth);
   $(this._svgSelector).height(viewPortHeight);
        
        
        
        this.getSVG().attr("viewBox", viewBox);
    }

    getSVG() {  return d3.select(this._svgSelector);}
    SVGclear()  { this.getSVG().selectAll("*").remove();}


    getSVGWidth(){  return $(this._svgSelector).width();}
    getSVGHeight() {  return $(this._svgSelector).height();}


    getTikzCode() {
        function tikzscale(x)  {return (x / 20).toFixed(3);  }

        let tikzCode = "\\begin{tikzpicture}[scale=0.95]\n";
        tikzCode += "\\tikzstyle{agenta} = [red];\n";
        tikzCode += "\\tikzstyle{agentb} = [blue];\n";
        tikzCode += "\\tikzstyle{agentc} = [orange];\n";
        tikzCode += "\\tikzstyle{world} = [draw];\n"
        getSVG().selectAll("g.node")
            .each(function (d) {
                tikzCode += "\\node[world] (" + d.id + ") at (" + tikzscale( d.x ) + ", " + tikzscale(d.y) + ") {" + d.label + "};\n";
            });

        getSVG().selectAll(".link").each(
            function (d) {
            let optionDraw = "[agent" + d.label + ", ";
            if(!d.doubledirection)
                optionDraw += "->";

            optionDraw += "]";


            let optionEdge = "";

            if(d.source.id == d.target.id)
                optionEdge = "[loop above]";
            tikzCode += "\\draw" + optionDraw + "(" + d.source.id + ") edge" + optionEdge + " (" + d.target.id + ");\n";
            }

        )
        tikzCode += "\\end{tikzpicture}";
        return tikzCode;
    }


} //end Class





















//******************* UTILS ***********************

/**
  @example getTuplesWorldEvent(["w", "u"], ["e", "f"])
*/
function getTuplesWorldEvent(W0, E0){
  let newW0 = new Array();
  W0.forEach(w => E0.forEach(e => newW0.push(createWorldActionName(w, e))));
  return newW0;
}






function graphNodeHighlight(nodeID) {
  graphNodeNoHighlight();
  $("#" + getSVGIdFromNodeID(nodeID) + " circle").attr("class", "highlight");
}



function graphNodeNoHighlight() {
  $(".node circle").attr("class", "");
}



function getSVGIdFromNodeID(nodeId) {
        return "graphNode" + nodeId;
}


function labelLengthToFontSize(length)
{
  let fontsize = 16-1*(length);
  return Math.max(fontsize, 8);
}



function edgeLabelToColor(label)
{
  if(label == "a" || label == "b" || label == "c")
      return getAgentColor(label);
  else
    return colorTimeEdge;

}


function getLinkLabel(d) {  return d.label;}

function getDistanceLink(d) {
  return Math.sqrt((d.target.x - d.source.x)*(d.target.x - d.source.x) + (d.target.y - d.source.y)*(d.target.y - d.source.y));
}

function isLinkTime(d) {  return !isAgent(d.label);}
function isLinkLoop(d) {  return d.target.id == d.source.id;}

function getLinkPosition(d) {
  return "M" + d.source.x + "," + d.source.y + "L " + d.target.x + "," + d.target.y;
}

function getLinkSourceX(d) {  return d.source.x; }
function getLinkSourceY(d) {  return d.source.y;}
function getLinkTargetX(d) {  return d.target.x;}
function getLinkTargetY(d) {  return d.target.y;}



function getGroupPositionCenter(group) {
  let graphcenterX = 200;
  return {x: graphcenterX, y: distanceBetweenGroups*(group)};
}




function getEpistemicRelationLinks(links) {
  let linkswithforces = [];

  for(let l of links) {
      if(l.epistemicrelation && (l.source.id != l.target.id))
        linkswithforces.push(l);
  }
  return linkswithforces;
}


function getTimeRelationLinks(links) {
  var linkswithforces = [];

  for(let l of links) {
      if(!l.epistemicrelation)
        linkswithforces.push(l);
  }

  return linkswithforces;
}























/*******************TIKZ*****************/

$(function () {
    // définition de la boîte de dialogue
    // la méthode jQuery dialog() permet de transformer un div en boîte de dialogue et de définir ses boutons
    $( "#codeTikzDialog" ).dialog({
        autoOpen: false,
        width: 600,
        buttons: [
            {
                text: "OK",
                click: function() {
                    $( this ).dialog( "close" );
                }
            }
        ]
    });
});


function GUIExportInTikz() {
    $('#codeTikz').val(getTikzCode());
    $( "#codeTikzDialog" ).dialog( "open" );
}
