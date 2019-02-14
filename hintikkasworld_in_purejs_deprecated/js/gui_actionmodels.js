let graphVisualizationActionModel = undefined;
let graphVisualizationEpistemicModel2 = undefined;



$().ready(function() {graphVisualizationActionModel = new GraphVisualization("#graphVisualizationActionModel");
    graphVisualizationActionModel.setNodesAreSquares();
    graphVisualizationEpistemicModel2 = new GraphVisualization("#graphVisualizationEpistemicModel2");
});


function showActionModel(actionModel) {
    $("#divgraphVisualizationActionModel").show();
    graphVisualizationActionModel.showGraph(actionModel);
    
    let M2 = product(M, actionModel);
    M2.removeUnReachablePartFrom(M2.getPointedWorld());
    graphVisualizationEpistemicModel2.showGraph(M2);
    graphVisualizationEpistemicModel2.importPositionsFromWithLastWorldID(graphVisualizationEpistemicModel);
}



function hideActionModel() {
    $("#divgraphVisualizationActionModel").hide();
    graphVisualizationActionModel.clear();
    graphVisualizationEpistemicModel2.clear();
}
