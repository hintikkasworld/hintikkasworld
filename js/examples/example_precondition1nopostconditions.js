'use strict';



function getPrecondition1NoPostconditionsEpistemicModel()
{
  let M = new EpistemicModel();

  M.addWorld("w", new SimpleWorld(["p"]));
  M.addWorld("u", new SimpleWorld(["q"]));
  M.addEdge("a", "w", "w");
  M.addEdge("a", "w", "u");

  M.setPointedWorld("w");

  return M;
}



function getActionModelPrecondition1AndNoPostconditionsI() {
    let E = new ActionModel();
    E.addAction("i1", "q");
    E.addAction("i2", "(p and (Kpos a q))");
    E.addAction("i3", "(p and (Kpos a q))");
    E.addAction("i4", "(p and (not (Kpos a q)))");
    E.addEdge("a", "i2", "i1");
    E.addEdge("a", "i2", "i2");
    E.addEdge("a", "i2", "i3");
    E.addEdge("a", "i3", "i4");
    E.addEdge("a", "i4", "i4");
    E.setPointedAction("i2");
    return E;
}


function getActionModelPrecondition1AndNoPostconditionsD() {
    let E = new ActionModel();
    E.addAction("d1", "q");
    E.addAction("d2", "(Kpos a p)");
    
    E.addEdge("a", "d2", "d1");
    E.addEdge("a", "d2", "d2");
    E.setPointedAction("d2");
    return E;
}



function setExamplePrecondition1andNoPostconditions() {
 M = getPrecondition1NoPostconditionsEpistemicModel();

  addExplanation("This example shows that DEL with preconditions of modal depth 1 and no postconditions (i.e. postconditions are trivial) is already expressive.");
  addExplanation("More precisely, it shows that we can simulate a counter (increment and decrement).");
  addExplanation("This example was designed by Gaëtan Douéneau-Tabot.");

  addAction({label: "increment", 
             actionModel: getActionModelPrecondition1AndNoPostconditionsI()
            });

addAction({label: "decrement", 
             actionModel: getActionModelPrecondition1AndNoPostconditionsD()
            });
 compute();
 computeButtonsVisibleOrNot();

}

