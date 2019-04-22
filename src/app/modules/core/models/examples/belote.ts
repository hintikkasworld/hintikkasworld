import { Formula, FormulaFactory, ExactlyFormula, AndFormula } from './../formula/formula';
import { SymbolicEpistemicModel } from './../epistemicmodel/symbolic-epistemic-model';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { environment } from 'src/environments/environment';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicRelation, Obs } from '../epistemicmodel/symbolic-relation';
/**
 * @param truePropositions an array of true propositions
 * @returns a possible combination of cards
 * @example new CluedoWorld(["aWhite","bKnife","cLibrary","Hall","Pink","Gun"])
 * */

class BeloteWorld extends WorldValuation {

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
            for (let cardSuit of Belote.cardSuits)
                for (let cardValue of Belote.cardValues)
                    if (this.modelCheck(Belote.getVar(agent, cardSuit, cardValue))) {
                        this.drawBeloteCard(context, agent, i, cardSuit, cardValue);
                        i++;
                    }
            this.drawAgents(context);
        }
    }

}














export class Belote extends ExampleDescription {
    static readonly cardSuits = ["♦", "♣", "♥", "♠"];
    static readonly cardValues = ["1", "9", "K"]; //["1", "7", "8", "9", "10", "J", "Q", "K"];

    getName() { return "Belote"; }
    getInitialEpistemicModel() {

        let relations = new Map();

        let M = SymbolicEpistemicModel.build(BeloteWorld, ["a", "b", "c", "d"],
            Belote.getAtoms(), Belote.getInitialRelations(), Belote.getInitialSetWorldsFormula());
        M.setPointedValuation(Belote.getRandomInitialValuation());

        return M;
    }



    static arrayShuffle(rsort: any[]): any[] {
        for (var idx = 0; idx < rsort.length; idx++) {
            var swpIdx = idx + Math.floor(Math.random() * (rsort.length - idx));
            // now swap elements at idx and swpIdx
            var tmp = rsort[idx];
            rsort[idx] = rsort[swpIdx];
            rsort[swpIdx] = tmp;
        }
        return rsort;
    }


    static getRandomInitialValuation(): Valuation {
        function beloteArrayToListPropositions(A) {
            let nbCardsPerAgent = A.length / 4;
            let listPropositions = [];
            for (let i = 0; i < nbCardsPerAgent; i++)
                listPropositions.push("a" + A[i]);

            for (let i = nbCardsPerAgent; i < nbCardsPerAgent*2; i++)
                listPropositions.push("b" + A[i]);

            for (let i = nbCardsPerAgent*2; i < nbCardsPerAgent*3; i++)
                listPropositions.push("c" + A[i]);

            for (let i = nbCardsPerAgent*3; i < nbCardsPerAgent*4; i++)
                listPropositions.push("d" + A[i]);

            return listPropositions;
        }

        let A = Belote.arrayShuffle(Belote.getCardNames());
        return new Valuation(beloteArrayToListPropositions(A));
    }

    static getInitialSetWorldsFormula(): Formula {
        let formula = new AndFormula( environment.agents.map( (a) => new ExactlyFormula(3, Belote.getVarsOfAgent(a))));

        return formula;
    }

    static getInitialRelations(): Map<string, SymbolicRelation> {
        let R = new Map();
        for (let agent of environment.agents)
            R.set(agent, Belote.getInitialRelation(agent));
        return R;
    }
    static getInitialRelation(agent: string): SymbolicRelation {


        return new Obs(Belote.getVarsOfAgent(agent));
    }

    static getVar(agent: String, cardSuit: string, cardValue: string): string {
        return agent + cardSuit + cardValue;
    }


    static getVarsOfAgent(a: string): string[] {
        let A = [];
        for (let cardSuit of Belote.cardSuits)
            for (let cardValue of Belote.cardValues)
                A.push(Belote.getVar(a, cardSuit, cardValue));
        return A;
    }

    static getAtoms(): string[] {
        let A = [];
        for (let agent of environment.agents)
            for (let cardSuit of Belote.cardSuits)
                for (let cardValue of Belote.cardValues)
                    A.push(Belote.getVar(agent, cardSuit, cardValue));
        return A;
    }


    static getCardNames() {
        let A = [];
        for (let cardSuit of Belote.cardSuits)
            for (let cardValue of Belote.cardValues)
                A.push(cardSuit + cardValue);
        return A;
    }


    getWorldExample() { return new BeloteWorld(Belote.getRandomInitialValuation()); };

    getActions() { return []; }

    /*
        agents.forEach(a =>
            M.addEdgeIf(a,
                (w1, w2) =>
                    getBeloteWorldCardNames().map((i) => a + i)
                        .every((p) => (w1.modelCheck(p) == w2.modelCheck(p)))));
    
    */

}