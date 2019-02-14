'use strict';

/**
 * @param truePropositions an array of true propositions
 * @returns a state where the public channel is empty and truePropositions give the valuation
 * @example new AsynchronousPublicChannelState(["p", "q"])
 * */
class SallyAndAnneWorld extends WorldValuation
{
    /**
    @constructor
    */
    constructor(truePropositions) {
      super(truePropositions);
      this.agentAnnex = 96;
      this.agentSallyx = 32;
    }


    draw(context)
    {
    /*  context.beginPath();
      context.fillStyle = "#FF0000";
      context.strokeStyle = "black";
      context.moveTo(32+(128-32)/2,0);
      context.lineTo(128,agentY);
      context.lineTo(32, agentY);
      context.fill();
      context.stroke();*/
      let colorHomeBackground = "#EEDDFF";

      context.fillStyle = colorHomeBackground;
      context.fillRect(32, 1, 96, 63);
      context.strokeStyle = "black";
      context.strokeRect(32, 1, 96, 62);

      context.strokeStyle = colorHomeBackground;
      context.beginPath();
      context.moveTo(32,agentY+16);
      context.lineTo(32,agentY+32);
      context.stroke();

      context.drawImage(agentImages["a"], this.agentAnnex, agentY, 32, 32);


        if(this.modelCheck("bspy"))
            drawVisibilityLine(context, 3, 16, 48, 36);


        if(this.modelCheck("bhere"))
        {
          this.agentSallyx = 32;
          context.drawImage(agentImages["b"], this.agentSallyx, SallyAndAnneWorld.agentY, 32, 32);
        }

        else {
            this.agentSallyx = 0;
            context.drawImage(agentImages["b"], this.agentSallyx, SallyAndAnneWorld.agentY, 16, 16);
        }



        context.drawImage(SallyAndAnneWorld.boxImg, 80, SallyAndAnneWorld.objectsY, 32, 32);
        context.drawImage(SallyAndAnneWorld.basketImg, 46, SallyAndAnneWorld.objectsY, 32, 32);

        if(this.modelCheck("marbleBasket"))
          context.drawImage(SallyAndAnneWorld.basketWithMarbleImg, 46, SallyAndAnneWorld.objectsY, 32, 32);

        if(this.modelCheck("marbleBox"))
          context.drawImage(SallyAndAnneWorld.marbleImg, 90, SallyAndAnneWorld.objectsY+12, 8, 8);


        if(this.modelCheck("marbleb"))
        {
          let marbleWidth  = 16;
          if(this.agentSallyx < 10)
            marbleWidth = 8;
          context.drawImage(SallyAndAnneWorld.marbleImg, this.agentSallyx, SallyAndAnneWorld.agentY+4, marbleWidth, marbleWidth);
        }

    }

    getAgentRectangle(agentName)
    {
          if(agentName == "a")
               return new Rectangle(this.agentAnnex, agentY, 32, 32);
          else
               return new Rectangle(this.agentSallyx, agentY, 32, 32);

    }

}






SallyAndAnneWorld.basketImg = new Image();
SallyAndAnneWorld.basketImg.src = "img/basket.svg";

SallyAndAnneWorld.basketWithMarbleImg = new Image();
SallyAndAnneWorld.basketWithMarbleImg.src = "img/basket_with_marble.svg";

SallyAndAnneWorld.boxImg = new Image();
SallyAndAnneWorld.boxImg.src = "img/box.svg";

SallyAndAnneWorld.marbleImg = new Image();
SallyAndAnneWorld.marbleImg.src = "img/marble.svg";


SallyAndAnneWorld.agentY = 10;
SallyAndAnneWorld.objectsY = 38;

function getExampleSallyAndAnneEpistemicModel()
{
    let M = new EpistemicModel();

    M.addWorld("w", new SallyAndAnneWorld(["ahere", "bhere", "marbleb"]));
    M.makeReflexiveRelation("a");
    M.makeReflexiveRelation("b");
    M.setPointedWorld("w");

   return M;
}










function setExampleSallyAndAnne()
{


  M = getExampleSallyAndAnneEpistemicModel();

 $('#panelExampleFormulas').html('Example of formulas: '
+ "<ul><li>(ahere or bhere)</li>" +
  "<li>(K a marbleb)</li>" +
  "</ul>");


    addExplanation("This example comes from a psychological test originally called Sally and Anne. We start with a commonly known situation where Sally (agent b) and Anne (agent a) are at home. Agent b initially holds a marble.");

   addAction({label: "Agent b goes out.",
              precondition: "bhere",
              actionModel: getExampleSallyAndAnneSallyOut(),
              message:  "Bye. I go for a walk.",
              saidby: "b"
            });
   
   addAction({label: "Agent b goes in.",
              precondition: "(not bhere)",
              actionModel: getExampleSallyAndAnneSallyIn(),
              message:  "Hi ! I am home.",
              saidby: "b"
            });

   addAction({label: "Agent b starts spying.",
              precondition: "((not bhere) and (not bspy))",
              actionModel: actionSallySpyStart(),
            });
   
   addAction({label: "Agent b stops spying.",
              precondition: "((not bhere) and bspy)",
              actionModel: actionSallySpyStop(),
            });
   
   addAction({label: "Agent b puts the marble in the basket.",
              precondition: "(bhere and marbleb)",
              actionModel: actionSallyMarbleSallyToMarbleBasket(),
              message:  "Let us put this marble in the basket.",
              saidby: "b"
            });
   
   addAction({label: "Agent a transfers the marble from the basket to the box.",
              precondition: "marbleBasket",
              actionModel: () => actionAnneTransfersMarbleFromBasketToBox(),
            });

 compute();
 computeButtonsVisibleOrNot();

}



function getExampleSallyAndAnneSallyOut()
{
  var E = new ActionModel();
  E.addAction("e", "top", {"bhere": "bottom"});
  E.makeReflexiveRelation("a");
  E.makeReflexiveRelation("b");
  E.setPointedAction("e");
  return E;
}


function getExampleSallyAndAnneSallyIn()
{
  var E = new ActionModel();
  E.addAction("e", "top", {"bhere": "top", "bspy": "bottom"});
  E.makeReflexiveRelation("a");
  E.makeReflexiveRelation("b");
  E.setPointedAction("e");
  return E;
}


function actionSallySpyStart()
{
  var E = new ActionModel();
     E.addAction("e", "top", {"bspy": "top"});
    
    E.addAction("f", "top");

    E.addEdge("b", "e", "e");

    E.addEdge("a", "e", "f");
    E.addEdge("a", "f", "f");
    E.addEdge("b", "f", "f");
    E.setPointedAction("e");

    return E;
}


function actionSallySpyStop()
{
  var E = new ActionModel();

    E.addAction("e", "top", {"bspy": "bottom"});
    E.addAction("f", "top");

    E.addEdge("b", "e", "e");

    E.addEdge("a", "e", "f");
    E.addEdge("a", "f", "f");
    E.addEdge("b", "f", "f");
    E.setPointedAction("e");

    return E;
}


function actionSallyMarbleSallyToMarbleBasket()
{
  var E =   new ActionModel();

  if(M.getNode(M.getPointedWorld()).modelCheck("bhere"))
  if(M.getNode(M.getPointedWorld()).modelCheck("marbleb"))
          E.addAction("e", "top", {"marbleBasket": "top", "marbleb": "bottom"});
  else
    throw "Agent b is outside";

  E.makeReflexiveRelation("a");
  E.makeReflexiveRelation("b");
  E.setPointedAction("e");
  return E;


}








function actionAnneTransfersMarbleFromBasketToBox()
{
  var E =   new ActionModel();

  if(!M.getNode(M.getPointedWorld()).modelCheck("marbleBasket"))
  {
    throw "The marble should be in the basket";
  }

  if(M.getNode(M.getPointedWorld()).modelCheck("bhere"))
  {
          E.addAction("e", "top", {"marbleBasket": "bottom", "marbleBox": "top"});

            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");
  }
  else
//Sally is outside
  if(M.getNode(M.getPointedWorld()).modelCheck("bspy"))
  {
    var assignmentTransfer = {"marbleBasket": "bottom", "marbleBox": "top"};
    E.addAction("e", "top", assignmentTransfer);
    E.addAction("f", "top", assignmentTransfer);
    E.addAction("t", "top");

    E.addEdge("b", "e", "e");
    E.addEdge("a", "e", "f");

    E.addEdge("a", "f", "f");

    E.addEdge("b", "f", "t");
    E.addEdge("a", "t", "t");
    E.addEdge("b", "t", "t");
  }
  else
  {
          E.addAction("e", "top",{"marbleBasket": "bottom", "marbleBox": "top"});
          E.addAction("t", "top");
          E.addEdge("a", "e", "e");

          E.addEdge("b", "e", "t");
          E.addEdge("a", "t", "t");
          E.addEdge("b", "t", "t");
  }

  E.setPointedAction("e");

  return E;


}
