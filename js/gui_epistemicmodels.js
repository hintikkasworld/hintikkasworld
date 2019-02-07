let graphVisualizationEpistemicModel = undefined;

$().ready(function() {graphVisualizationEpistemicModel = new GraphVisualization("#graphVisualizationEpistemicModel"); });




/**
@description show the graph of the epistemic model M
*/
function showEpistemicModel(M) {
    graphVisualizationEpistemicModel.showGraph(M);
}


