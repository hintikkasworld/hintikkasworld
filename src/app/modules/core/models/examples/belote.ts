import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { environment } from 'src/environments/environment';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
/**
 * @param truePropositions an array of true propositions
 * @returns a possible combination of cards
 * @example new CluedoWorld(["aWhite","bKnife","cLibrary","Hall","Pink","Gun"])
 * */

class BeloteWorld extends WorldValuation {

    static readonly cardSuits = ["♦", "♣", "♥", "♠"];
    static readonly cardValues = ["1", "7", "8", "9", "10", "J", "Q", "K"];
    static readonly cardWidth = 9;
    static readonly cardHeight = 8;


    constructor(valuation: Valuation) {
        super(valuation);

        this.agentPos["a"] = { x: 64, y: 16, r: 8 };
        this.agentPos["b"] = { x: 128 - BeloteWorld.cardWidth - 10, y: 32, r: 8 };
        this.agentPos["c"] = { x: 64, y: 48, r: 8 };
        this.agentPos["d"] = { x: 20, y: 32, r: 8 };
    }


    drawBeloteCard(context: CanvasRenderingContext2D, agent: string, i: number, cardSuit: string, cardValue: string) {
        let x, y, dx, dy;
        if (agent == "a") { x = 64 - 4 * BeloteWorld.cardWidth; y = 0; dx = BeloteWorld.cardWidth; dy = 0; }
        if (agent == "b") { x = 128 - BeloteWorld.cardWidth; y = 0; dx = 0; dy = BeloteWorld.cardHeight; }
        if (agent == "c") { x = 64 - 4 * BeloteWorld.cardWidth; y = 56; dx = BeloteWorld.cardWidth; dy = 0; }
        if (agent == "d") { x = 0; y = 0; dx = 0; dy = BeloteWorld.cardHeight; }

        let color;

        if ((cardSuit == "♥") || (cardSuit == "♦"))
            color = "#FF0000";
        else
            color = "#000000";

        BeloteWorld.drawCard(context, { x: x + i * dx, y: y + i * dy, w: BeloteWorld.cardWidth, h: BeloteWorld.cardHeight, fontSize: 5, color: color, text: cardValue + cardSuit });

    }

    draw(context: CanvasRenderingContext2D) {
        for (let agent of environment.agents) {
            let i = 0;
            for (let cardSuit of BeloteWorld.cardSuits)
                for (let cardValue of BeloteWorld.cardValues)
                    if (this.modelCheck(agent + cardValue + cardSuit)) {
                        this.drawBeloteCard(context, agent, i, cardSuit, cardValue);
                        i++;
                    }
            this.drawAgents(context);
        }
    }

}














export class Belote extends ExampleDescription {
    getName() { return "Belote"; }
    getInitialEpistemicModel() {


        function addRandomBeloteWorld(M: ExplicitEpistemicModel) {


            function getBeloteWorldCardNames() {
                let A = [];
                for (let cardSuit of BeloteWorld.cardSuits)
                    for (let cardValue of BeloteWorld.cardValues)
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





            function beloteArrayToListPropositions(A): string[] {
                let listPropositions: string[] = [];
                for (let i = 0; i < 8; i++)
                    listPropositions.push("a" + A[i]);

                for (let i = 8; i < 16; i++)
                    listPropositions.push("b" + A[i]);

                for (let i = 16; i < 24; i++)
                    listPropositions.push("c" + A[i]);

                for (let i = 24; i < 32; i++)
                    listPropositions.push("d" + A[i]);

                return listPropositions;
            }


            let A = arrayShuffle(getBeloteWorldCardNames());

            let listPropositions = beloteArrayToListPropositions(A);

            let worldName = "w" + listPropositions.join();
            M.addWorld(worldName, new BeloteWorld(new Valuation(listPropositions)));

            return worldName;
        }

        let M = new ExplicitEpistemicModel();

        let w = addRandomBeloteWorld(M);


        M.setPointedWorld(w);

        return M;
    }


    getActions() { return []; }

    /*
        agents.forEach(a =>
            M.addEdgeIf(a,
                (w1, w2) =>
                    getBeloteWorldCardNames().map((i) => a + i)
                        .every((p) => (w1.modelCheck(p) == w2.modelCheck(p)))));
    
    */

}