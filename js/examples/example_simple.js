'use strict';


/**
 * @param truePropositions an array of true propositions. Proposition "ma" stands for "a is muddy" and "mb" stands for "b is muddy".
 * @returns a state corresponding to the muddy children puzzle
 * @example new MuddyChildrenWorld(["ma", "mb"])
 * */
class SimpleWorld extends WorldValuation
{
    constructor(propositions)
    {
        super(propositions);
        this.agentPos["a"] = {x: 24, y: 32, r: 24};
        this.agentPos["b"] = {x: 128-24, y: 32, r: 24};
        this.agentPos["c"] = undefined;
    }

    draw(context)
    {
        this.drawAgents(context);

       context.drawImage(SimpleWorld.basketImg, 64-16, 0, 32, 32);

       if(this.modelCheck(SimpleWorld.proposition))
         context.drawImage(SimpleWorld.basketWithMarbleImg, 64-16, 0, 32, 32);
    }

}

SimpleWorld.basketImg = new Image();
SimpleWorld.basketImg.src = "img/basket.svg";

SimpleWorld.basketWithMarbleImg = new Image();
SimpleWorld.basketWithMarbleImg.src = "img/basket_with_marble.svg";
SimpleWorld.proposition = "p";


function getSimpleExampleInitialEpistemicModel()
{
  let M = new EpistemicModel();

  M.addWorld("w", new SimpleWorld([SimpleWorld.proposition]));
  M.addWorld("u", new SimpleWorld([]));



  M.setPointedWorld("w");

  M.addEdgesCluster("a", ["w", "u"]);
  M.addEdgesCluster("b", ["w", "u"]);

  return M;
}




function setExampleSimple() {
 M = getSimpleExampleInitialEpistemicModel();

 $('#panelExampleFormulas').html('Example of formulas: '
+ "<ul><li>(ma or mb)</li>" +
  "<li>((not (K a ma)) and (not (K b mb)))</li>" +
  "</ul>");

  addExplanation("Agent a and agent b are initially ignorant whether there is a marble in the basket or not. This situation is common knowledge.",
                 "((not (K a " + SimpleWorld.proposition + ")) and (not (K b " + SimpleWorld.proposition + ")))");

  addAction({label: "Public announcement that there is a marble in the basket", 
             actionModel: getActionModelPublicAnnouncement(SimpleWorld.proposition, ["a", "b"]),
             perform: () => {performAction(getActionModelPublicAnnouncement(SimpleWorld.proposition, ["a", "b"])); speak("c", "There is a marble in the basket");},
            });
  
  addAction({label: "Private announcement to agent a of the content of the basket. Agent b knows that this private announcement occurs.", 
             precondition: "(not (K a " + SimpleWorld.proposition + "))",
             actionModel: getActionModelSemiPrivateAnnouncement(SimpleWorld.proposition, "a", ["a", "b"])             
            });

  addAction({label: "Private announcement to agent a that there is a marble in the basket. Agent b is ignorant about that.", 
             precondition: "(not (K a " + SimpleWorld.proposition + "))",
             actionModel: getActionModelPrivateAnnouncement(SimpleWorld.proposition, "a", ["a", "b"])             
            });
  
  


 compute();
 computeButtonsVisibleOrNot();

}
