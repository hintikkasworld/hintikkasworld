'use strict';


function getNonKD45InitialEpistemicModel()
{
  let M = new EpistemicModel();

  M.addWorld("w", new SimpleWorld([SimpleWorld.proposition]));
  M.addWorld("u", new SimpleWorld([]));
  M.addWorld("v", new SimpleWorld([SimpleWorld.proposition]));
  M.addWorld("s", new SimpleWorld([]));
  M.addWorld("t", new SimpleWorld([SimpleWorld.proposition]));


  M.setPointedWorld("w");
  M.addEdge("a", "w", "u");
  M.addEdge("a", "u", "v");
  
  M.addEdge("b", "w", "s");
  M.addEdge("b", "w", "t");
  
  M.addEdge("b", "s", "s");
  M.addEdge("b", "t", "t");
  

  return M;
}




function setExampleNonKD45() {
 M = getNonKD45InitialEpistemicModel();


  addExplanation("This example shows an non KD45 epistemic state. The relations are not serial. The relation for agent a is not transitive. The relation for agent b is not Euclidean.", "top");
 


 compute();
 computeButtonsVisibleOrNot();

}
