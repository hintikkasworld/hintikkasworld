import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { environment } from 'src/environments/environment';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { World } from '../epistemicmodel/world';
/**
 * @param valuation a valuation
 * */
class HanabiWorld extends WorldValuation {

    static readonly cardSuits = ["green", "blue", "orange", "red"];
    static readonly cardValues = ["1", "2", "3", "4", "5"];
    static readonly cardWidth = 9;
    static readonly cardHeight = 8;
    static readonly cardNumber = 5;

    constructor(valuation: Valuation) {
        super(valuation);

        this.agentPos["a"] = { x: 64, y: 16, r: 8 };
        this.agentPos["b"] = { x: 128 - HanabiWorld.cardWidth - 10, y: 32, r: 8 };
        this.agentPos["c"] = { x: 64, y: 48, r: 8 };
        this.agentPos["d"] = { x: 20, y: 32, r: 8 };



    }


    static drawHanabiCard(context: CanvasRenderingContext2D, agent: string, i: number, cardSuit: string, cardValue: string) {
        let x, y, dx, dy;
        if (agent == "a") { x = 64 - HanabiWorld.cardNumber / 2 * HanabiWorld.cardWidth; y = 0; dx = HanabiWorld.cardWidth; dy = 0; }
        if (agent == "b") { x = 128 - HanabiWorld.cardWidth; y = 10; dx = 0; dy = HanabiWorld.cardHeight; }
        if (agent == "c") { x = 64 - HanabiWorld.cardNumber / 2 * HanabiWorld.cardWidth; y = 56; dx = HanabiWorld.cardWidth; dy = 0; }
        if (agent == "d") { x = 0; y = 10; dx = 0; dy = HanabiWorld.cardHeight; }

        HanabiWorld.drawCard(context, { x: x + i * dx, y: y + i * dy, w: HanabiWorld.cardWidth, h: HanabiWorld.cardHeight, fontSize: 5, color: cardSuit, text: cardValue });

    }

    draw(context: CanvasRenderingContext2D) {
        for (let agent of environment.agents) {
            let i = 0;
            for (let cardSuit of HanabiWorld.cardSuits)
                for (let cardValue of HanabiWorld.cardValues)
                    if (this.modelCheck(agent + cardValue + cardSuit)) {
                        HanabiWorld.drawHanabiCard(context, agent, i, cardSuit, cardValue);
                        i++;
                    }
            this.drawAgents(context);
        }
    }

}















export class Hanabi extends ExampleDescription {
    getName() { return "Hanabi"; }
    getInitialEpistemicModel() {


        function addRandomHanabiWorld(M: ExplicitEpistemicModel) {


            function getBeloteWorldCardNames() {
                let A = [];
                for (let cardSuit of HanabiWorld.cardSuits)
                    for (let cardValue of HanabiWorld.cardValues)
                        A.push(cardValue + cardSuit);
                return A;
            }


            function arrayShuffle(rsort) {
                for (var idx = 0; idx < rsort.length; idx++) {
                    var swpIdx = idx + Math.floor(Math.random() * (rsort.length - idx));
                    // now swap elements at idx and swpIdx
                    var tmp = rsort[idx];
                    rsort[idx] = rsort[swpIdx];
                    rsort[swpIdx] = tmp;
                }
                return rsort;
            }





            function hanabiArrayToListPropositions(A): string[] {
                let listPropositions = [];
                for (let i = 0; i < HanabiWorld.cardNumber; i++)
                    listPropositions.push("a" + A[i]);

                for (let i = HanabiWorld.cardNumber; i < 2 * HanabiWorld.cardNumber; i++)
                    listPropositions.push("b" + A[i]);

                for (let i = 2 * HanabiWorld.cardNumber; i < 3 * HanabiWorld.cardNumber; i++)
                    listPropositions.push("c" + A[i]);

                for (let i = 3 * HanabiWorld.cardNumber; i < 4 * HanabiWorld.cardNumber; i++)
                    listPropositions.push("d" + A[i]);

                return listPropositions;
            }


            let A = arrayShuffle(getBeloteWorldCardNames());

            let listPropositions = hanabiArrayToListPropositions(A);

            let worldName = "w" + listPropositions.join();
            M.addWorld(worldName, new HanabiWorld(new Valuation(listPropositions)));

            return worldName;
        }

        let M = new ExplicitEpistemicModel();

        let w = addRandomHanabiWorld(M);


        M.setPointedWorld(w);

        return M;
    }


    getActions() { return []; }


}