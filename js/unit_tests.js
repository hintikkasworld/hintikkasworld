'use strict';

let isUnitTest = false;
/**
This file contains unit tests of Hintikka's world*/


function unitTests()
{
  if(!isUnitTest) return;
try{



  unitTestAssert("modelChecking.negation",
    function()
    {
      let M = new EpistemicModel();
      M.addWorld("w", []);
      return M.modelCheck("w", createFormula("(not p)")); //(not p) should be true
    }());



  unitTestAssert("postconditions",
     function()
     {
       let M = new EpistemicModel();
       M.addWorld("w", new SallyAndAnneWorld(["marbleBasket"]));
       let PA = new PropositionalAssignmentsPostcondition({"marbleBasket": "bottom"});
       let world = PA.perform(M, "w");
       return !world.modelCheck("marbleBasket");
     }());


     unitTestAssert("postconditions.product",
        function()
        {
          let M = new EpistemicModel();
          M.addWorld("w", ["p"]);
          M.setPointedWorld("w");
          let E = new ActionModel();
          E.addAction("e", "top", {p: 0});
          E.setPointedAction("e");
          let ME = product(M, E);
          return ME.modelCheck(createWorldActionName("w", "e"), createFormula("(not p)"));
        }());




   unitTestAssert("postconditions.noSideEffect",
      function()
      {
        let M = new EpistemicModel();
        M.addWorld("w", new SallyAndAnneWorld(["marbleBasket"]));
        let PA = new PropositionalAssignmentsPostcondition({"marbleBasket": "bottom"});
        let world = PA.perform(M, "w");
        return !world.modelCheck("marbleBasket") && M.modelCheck("w", "marbleBasket");
      }());


    unitTestAssert("postconditions.AnneSallyExample",
       function()
       {
         let M = getExampleSallyAndAnneEpistemicModel();
         let E = getExampleSallyAndAnneSallyOut();
         let M2 = product(M, E);
         return M2.modelCheck(createWorldActionName("w", "e"), createFormula("(not bhere)"));
       }());

   unitTestAssert("postconditions.AnneSallyExample.noSideEffect",
      function()
      {
        let M = getExampleSallyAndAnneEpistemicModel();
        let E = getExampleSallyAndAnneSallyOut();
        let M2 = product(M, E);
        return M.modelCheck("w", "bhere");
      }());


      unitTestAssert("Model.contraction.singlenode",
         function()
         {
           let M = new EpistemicModel();
           M.addWorld("w", []);
           M.setPointedWorld("w");
           let N = M.contract();
           return (N.getNodesNumber() == 1) && (N.getPointedWorld() != undefined);
         }());

       unitTestAssert("Model.contraction.singlenode.integerstring",
          function()
          {
            let M = new EpistemicModel();
            M.addWorld("1", []);
            M.setPointedWorld("1");
            let N = M.contract();
            return (N.getNodesNumber() == 1) && (N.getPointedWorld() != undefined);
          }());


       unitTestAssert("Model.contraction.singlenode.twice",
          function()
          {
            let M = new EpistemicModel();
            M.addWorld("w", []);
            M.setPointedWorld("w");
            let N = M.contract().contract();
            return N.getPointedWorld() != undefined;
          }());


/*
let M0 = new EpistemicModel(); M0.addWorld("w", []); M0.setPointedWorld("w");


*/
       unitTestAssert("Model.contraction.singlenode.class",
          function()
          {
            let M = new EpistemicModel();
            M.addWorld("w", new SallyAndAnneWorld("ma"));
            M.setPointedWorld("w");
            let N = M.contract();
            return (N.getNode(N.getPointedWorld()) instanceof SallyAndAnneWorld);
          }());




      unitTestAssert("Model.contraction.reflexivesinglenode",
         function()
         {
           let M = new EpistemicModel();
           M.addWorld("w", []);
           M.addEdge("a","w","w");
           M.addEdge("b","w","w");
           M.setPointedWorld("w");
           let N = M.contract();
           return (N.getNodesNumber() == 1);
         }());



       unitTestAssert("Model.contraction.reflexivesinglenode.twice",
          function()
          {
            let M = new EpistemicModel();
            M.addWorld("w", []);
            M.addEdge("a","w","w");
            M.addEdge("b","w","w");
            M.setPointedWorld("w");
            let N = M.contract().contract();
            return (N.getPointedWorld() != undefined);
          }());


      unitTestAssert("Model.contraction",
         function()
         {
           let M = new EpistemicModel();
           M.addWorld("w", ["p"]);
           M.addWorld("u", ["p"]);
           M.addWorld("s", ["r","mb"]);
           M.addWorld("t", []);
           M.addEdge("a","w","u");
           M.addEdge("a","w","s");
           M.addEdge("a","w","t");
           M.addEdge("a","u","s");
           M.addEdge("a","u","t");
           M.addEdge("a","u","u");
           M.addEdge("b","s","t");
           M.setPointedWorld("w");
           let N = M.contract();
           return (N.getNodesNumber() == 3);
         }());

         unitTestAssert("Model.contraction2",
            function()
            {
              let M = new EpistemicModel();
              M.addWorld("w", ["p"]);
             M.addWorld("u", ["p"]);
             M.addEdge("a","w","u");
              M.setPointedWorld("w");
              let N = M.contract();
             return (N.getNodesNumber() == 2);
            }());

            unitTestAssert("Model.contraction3",
               function()
               {
                 let M = new EpistemicModel();
                 M.addWorld("w", ["p"]);
                 M.addWorld("u", ["p"]);
                 M.addEdge("a","w","u");
                 M.addEdge("a","u","u");
                 M.setPointedWorld("w");
                 let N = M.contract();
                 return (N.getNodesNumber() == 1);
               }());

       unitTestAssert("Model.contraction4",
          function()
          {
            let M = new EpistemicModel();
            M.addWorld("w", ["r"]);
            M.addWorld("u", ["r"]);
            M.addWorld("v", ["bla"]);
            M.addWorld("x", ["bla"]);
            M.addWorld("y", ["bl"]);
            M.addWorld("z", ["bl"]);
            M.addWorld("t", ["bl"]);
            M.addEdge("a","w","u");
            M.addEdge("a","u","w");
            M.addEdge("a","u","u");
            M.addEdge("a","w","w");
            M.addEdge("a","t","t");
            M.addEdge("a","z","z");
            M.addEdge("a","t","z");
            M.addEdge("a","z","t");
            M.addEdge("a","y","y");
            M.addEdge("b","u","x");
            M.addEdge("b","w","v");
            M.addEdge("b","w","t");
            M.addEdge("b","w","z");
            M.addEdge("b","u","y");
            M.setPointedWorld("w");
            let N = M.contract();
            return (N.getNodesNumber() == 3);
          }());

        /*  unitTestAssert("RussianCards",
             function()
             {
               let M ;
               getExampleRussianCards();
               return(M.getNodesNumber()==140);
             }());
*/

    /**unitTestAssert("Model.contraction.museum",
       function()
       {
         let qDECPOMDPMuseum = createQDECPOMDPMuseum();
         let kbpa = createKnowledgeBasedProgram("goToMuseum; goToMuseum;");
         let kbpb = createKnowledgeBasedProgram("goToRiverside; enjoy;");
         pcgrapha = getProgramCounterGraph(kbpa);
         pcgraphb = getProgramCounterGraph(kbpb);
         M = qdecPOMDPPoliciesToInitialEpistemicModel(qDECPOMDPMuseum, {"a": pcgrapha, "b": pcgraphb});
         console.log(M);
         let N = M.contract().contract();
         return (N.getNodesNumber() == 1) && (N.getPointedWorld() != undefined);
       }());*/


}
catch(error)
{
  alert(error);
}


}


unitTests();



function unitTestAssert(name, arg)
{
  if(!arg)
  {
    alert("unit test " + name + ": failed");
  }
  else {
    console.log("unit test " + name + ": succeeded")
  }
}
