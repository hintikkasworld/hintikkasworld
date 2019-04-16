import { Valuation } from './../epistemicmodel/valuation';
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';
import { FormulaFactory } from './../formula/formula';
import { EventModelAction } from './../environment/event-model-action';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { Rectangle } from './../rectangle';
import { environment } from 'src/environments/environment';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { ExampleDescription } from '../environment/exampledescription';

/**
 * @param truePropositions an array of true propositions
 * @returns a state where the public channel is empty and truePropositions give the valuation
 * @example new AsynchronousPublicChannelState(["p", "q"])
 **/
class SallyAndAnneWorld extends WorldValuation {
    agentAnnex = 96;
    agentSallyx = 32;

    static readonly basketImg = SallyAndAnneWorld.getImage("basket.svg");
    static readonly basketWithMarbleImg = SallyAndAnneWorld.getImage("basket_with_marble.svg");
    static readonly boxImg = SallyAndAnneWorld.getImage("box.svg");
    static readonly marbleImg = SallyAndAnneWorld.getImage("marble.svg");


    static readonly agentY = 10;
    static readonly objectsY = 38;

    /**
    @constructor
    */
    constructor(valuation: Valuation) {
        super(valuation);
        this.agentPos["a"] = {};
    }


    draw(context) {
        this.drawAgents(context);
        let colorHomeBackground = "#EEDDFF";

        context.fillStyle = colorHomeBackground;
        context.fillRect(32, 1, 96, 63);
        context.strokeStyle = "black";
        context.strokeRect(32, 1, 96, 62);

        context.strokeStyle = colorHomeBackground;
        context.beginPath();
        context.moveTo(32, SallyAndAnneWorld.agentY + 16);
        context.lineTo(32, SallyAndAnneWorld.agentY + 32);
        context.stroke();

        context.drawImage(SallyAndAnneWorld.agentImages["a"], this.agentAnnex, SallyAndAnneWorld.agentY, 32, 32);


        if (this.modelCheck("bspy"))
            SallyAndAnneWorld.drawVisibilityLine(context, 3, 16, 48, 36);


        if (this.modelCheck("bhere")) {
            this.agentSallyx = 32;
            context.drawImage(SallyAndAnneWorld.agentImages["b"], this.agentSallyx, SallyAndAnneWorld.agentY, 32, 32);
        }

        else {
            this.agentSallyx = 0;
            context.drawImage(SallyAndAnneWorld.agentImages["b"], this.agentSallyx, SallyAndAnneWorld.agentY, 16, 16);
        }



        context.drawImage(SallyAndAnneWorld.boxImg, 80, SallyAndAnneWorld.objectsY, 32, 32);
        context.drawImage(SallyAndAnneWorld.basketImg, 46, SallyAndAnneWorld.objectsY, 32, 32);

        if (this.modelCheck("marbleBasket"))
            context.drawImage(SallyAndAnneWorld.basketWithMarbleImg, 46, SallyAndAnneWorld.objectsY, 32, 32);

        if (this.modelCheck("marbleBox"))
            context.drawImage(SallyAndAnneWorld.marbleImg, 90, SallyAndAnneWorld.objectsY + 12, 8, 8);


        if (this.modelCheck("marbleb")) {
            let marbleWidth = 16;
            if (this.agentSallyx < 10)
                marbleWidth = 8;
            context.drawImage(SallyAndAnneWorld.marbleImg, this.agentSallyx, SallyAndAnneWorld.agentY + 4, marbleWidth, marbleWidth);
        }

    }

    getAgentRectangle(agentName) {
        if (agentName == "a")
            return new Rectangle(this.agentAnnex, SallyAndAnneWorld.agentY, 32, 32);
        else
            return new Rectangle(this.agentSallyx, SallyAndAnneWorld.agentY, 32, 32);

    }

}

















export class SallyAndAnn extends ExampleDescription {
    getName() { return "Sally and Ann"; }

    getInitialEpistemicModel(): EpistemicModel {
        let M = new ExplicitEpistemicModel();

        M.addWorld("w", new SallyAndAnneWorld(new Valuation(["ahere", "bhere", "marbleb"])));
        M.makeReflexiveRelation("a");
        M.makeReflexiveRelation("b");
        M.setPointedWorld("w");

        return M;
    }


    getActions() {
        function getExampleSallyAndAnneSallyOut() {
            var E = new ExplicitEventModel();
            E.addAction("e", FormulaFactory.createFormula("bhere"),
                new PropositionalAssignmentsPostcondition({ "bhere": "bottom" }));
            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");
            E.setPointedAction("e");
            return E;
        }

        function getExampleSallyAndAnneSallyIn() {
            var E = new ExplicitEventModel();
            E.addAction("e", FormulaFactory.createFormula("(not bhere)"), new PropositionalAssignmentsPostcondition({ "bhere": FormulaFactory.createTrue(), "bspy": "bottom" }));
            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");
            E.setPointedAction("e");
            return E;
        }

        function actionSallySpyStart() {
            var E = new ExplicitEventModel();
            E.addAction("e", FormulaFactory.createFormula("((not bhere) and (not bspy))"), new PropositionalAssignmentsPostcondition({ "bspy": FormulaFactory.createTrue() }));
            E.addAction("f", FormulaFactory.createTrue());

            E.addEdge("b", "e", "e");
            E.addEdge("a", "e", "f");
            E.addEdge("a", "f", "f");
            E.addEdge("b", "f", "f");
            E.setPointedAction("e");

            return E;
        }


        function actionSallySpyStop() {
            var E = new ExplicitEventModel();

            E.addAction("e", FormulaFactory.createFormula("((not bhere) and bspy)"), new PropositionalAssignmentsPostcondition({ "bspy": "bottom" }));
            E.addAction("f", FormulaFactory.createTrue());

            E.addEdge("b", "e", "e");

            E.addEdge("a", "e", "f");
            E.addEdge("a", "f", "f");
            E.addEdge("b", "f", "f");
            E.setPointedAction("e");

            return E;
        }


        function actionSallyMarbleSallyToMarbleBasket() {
            var E = new ExplicitEventModel();

            /*     if (M.getNode(M.getPointedWorld()).modelCheck("bhere"))
            /*         if (M.getNode(M.getPointedWorld()).modelCheck("marbleb"))*/
            E.addAction("e", FormulaFactory.createFormula("(bhere and marbleb)"), new PropositionalAssignmentsPostcondition({ "marbleBasket": FormulaFactory.createTrue(), "marbleb": "bottom" }));
            /*         else
           /*              throw "Agent b is outside";*/

            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");
            E.setPointedAction("e");
            return E;


        }


        function actionAnneTransfersMarbleFromBasketToBoxWhenBHere() {
            var E = new ExplicitEventModel();
            E.addAction("e", FormulaFactory.createFormula("(bhere and marbleBasket)"), new PropositionalAssignmentsPostcondition({ "marbleBasket": "bottom", "marbleBox": FormulaFactory.createTrue() }));

            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");

            E.setPointedAction("e");
            return E;
        }



        function actionAnneTransfersMarbleFromBasketToBoxWhenBOutsideSpying() {
            var E = new ExplicitEventModel();

            var assignmentTransfer = new PropositionalAssignmentsPostcondition({ "marbleBasket": "bottom", "marbleBox": FormulaFactory.createTrue() });
            E.addAction("e", FormulaFactory.createFormula("((not bhere) and marbleBasket and bspying)"), assignmentTransfer);
            E.addAction("f", FormulaFactory.createTrue(), assignmentTransfer);
            E.addAction("t", FormulaFactory.createTrue());

            E.addEdge("b", "e", "e");
            E.addEdge("a", "e", "f");

            E.addEdge("a", "f", "f");

            E.addEdge("b", "f", "t");
            E.addEdge("a", "t", "t");
            E.addEdge("b", "t", "t");

            E.setPointedAction("e");
            return E;
        }


        function actionAnneTransfersMarbleFromBasketToBoxWhenBOutsideNotSpying() {
            var E = new ExplicitEventModel();

            E.addAction("e", FormulaFactory.createFormula("((not bhere) and marbleBasket and (not bspying))"),
                new PropositionalAssignmentsPostcondition({ "marbleBasket": "bottom", "marbleBox": FormulaFactory.createTrue() }));
            E.addAction("t", FormulaFactory.createTrue());
            E.addEdge("a", "e", "e");

            E.addEdge("b", "e", "t");
            E.addEdge("a", "t", "t");
            E.addEdge("b", "t", "t");
            E.setPointedAction("e");

            return E;
        }



        return [

            new EventModelAction({
                name: "Agent b goes out.",
                eventModel: getExampleSallyAndAnneSallyOut(),
                /*  message: "Bye. I go for a walk.",
                  saidby: "b"*/
            }),

            new EventModelAction({
                name: "Agent b goes in.",
                eventModel: getExampleSallyAndAnneSallyIn(),
                /*    message: "Hi ! I am home.",
                    saidby: "b"*/
            }),

            new EventModelAction({
                name: "Agent b starts spying.",
                eventModel: actionSallySpyStart(),
            }),

            new EventModelAction({
                name: "Agent b stops spying.",
                eventModel: actionSallySpyStop(),
            }),

            new EventModelAction({
                name: "Agent b puts the marble in the basket.",
                eventModel: actionSallyMarbleSallyToMarbleBasket(),
                /*  message: "Let us put this marble in the basket.",
                  saidby: "b"*/
            }),

            new EventModelAction({
                name: "Agent a transfers the marble from the basket to the box and b is here.",
                eventModel: actionAnneTransfersMarbleFromBasketToBoxWhenBHere(),
            }),

            new EventModelAction({
                name: "Agent a transfers the marble from the basket to the box and b is outside.",
                eventModel: actionAnneTransfersMarbleFromBasketToBoxWhenBOutsideNotSpying()
            }),

            new EventModelAction({
                name: "Agent a transfers the marble from the basket to the box and b is outside and spying.",
                eventModel: actionAnneTransfersMarbleFromBasketToBoxWhenBOutsideSpying()
            }),
        ];


    }


}
