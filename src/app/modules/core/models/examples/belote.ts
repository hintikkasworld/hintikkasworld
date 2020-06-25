import { AndFormula, ExactlyFormula, Formula } from '../formula/formula';
import { SymbolicEpistemicModelBDD } from '../epistemicmodel/symbolic-epistemic-model-bdd';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { Obs, SymbolicRelation } from '../epistemicmodel/symbolic-relation';
import { SEModelDescriptor } from '../epistemicmodel/descriptor/se-model-descriptor';
import { SymbolicEpistemicModelTouist } from '../epistemicmodel/symbolic-epistemic-model-touist';

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

        this.agentPos['a'] = { x: 64, y: 16, r: 8 };
        this.agentPos['b'] = { x: 128 - BeloteWorld.cardWidth - 10, y: 32, r: 8 };
        if (Belote.getAgents().length >= 3) {
            this.agentPos['c'] = { x: 64, y: 48, r: 8 };
        }
        if (Belote.getAgents().length >= 4) {
            this.agentPos['d'] = { x: 20, y: 32, r: 8 };
        }
    }

    drawBeloteCard(context: CanvasRenderingContext2D, agent: string, i: number, cardSuit: string, cardValue: string) {
        let x, y, dx, dy;

        const cardSuitSymbol = BeloteWorld.getCardSuitSymbol(cardSuit);

        if (agent == 'a') {
            x = 64 - 4 * BeloteWorld.cardWidth;
            y = 0;
            dx = BeloteWorld.cardWidth;
            dy = 0;
        }
        if (agent == 'b') {
            x = 128 - BeloteWorld.cardWidth;
            y = 0;
            dx = 0;
            dy = BeloteWorld.cardHeight;
        }
        if (agent == 'c') {
            x = 64 - 4 * BeloteWorld.cardWidth;
            y = 56;
            dx = BeloteWorld.cardWidth;
            dy = 0;
        }
        if (agent == 'd') {
            x = 0;
            y = 0;
            dx = 0;
            dy = BeloteWorld.cardHeight;
        }

        let color;

        if (cardSuitSymbol == '♥' || cardSuitSymbol == '♦') {
            color = '#FF0000';
        } else {
            color = '#000000';
        }

        BeloteWorld.drawCard(context, {
            x: x + i * dx,
            y: y + i * dy,
            w: BeloteWorld.cardWidth,
            h: BeloteWorld.cardHeight,
            fontSize: 5,
            color,
            text: cardValue + cardSuitSymbol
        });
    }


    static getCardSuitSymbol(cardSuit: string) {
        if(cardSuit == "c") return "♦";
        if(cardSuit == "t") return "♣";
        if(cardSuit == "h") return "♥";
        if(cardSuit == "p") return "♠";
        
    }

    draw(context: CanvasRenderingContext2D) {
        for (let agent of Belote.getAgents()) {
            let i = 0;
            for (let cardSuit of Belote.cardSuits) {
                for (let cardValue of Belote.cardValues) {
                    if (this.modelCheck(Belote.getVar(agent, cardSuit, cardValue))) {
                        this.drawBeloteCard(context, agent, i, cardSuit, cardValue);
                        i++;
                    }
                }
            }
            this.drawAgents(context);
        }
    }
}

export class Belote extends ExampleDescription {
    static readonly cardSuits: string[] = ['c', 't', 'h', 'p']; // ["♥", "♠"];//["♦", "♣", "♥", "♠"]; //
    static readonly cardValues: string[] = ['1', '7', '8', '9', 'J', 'Q', 'K']; // [ "1", "7", "8", "9", "J", "Q", "K"];//["1", "7", "8", "9", "10", "J", "Q", "K"];

    static getAgents(): string[] {
        return ['a', 'b', 'c', 'd'];
    }

    static getInitialNumberOfCardsByAgent() {
        return (Belote.cardSuits.length * Belote.cardValues.length) / Belote.getAgents().length;
    }

    static arrayShuffle(rsort: any[]): any[] {
        for (let idx = 0; idx < rsort.length; idx++) {
            let swpIdx = idx + Math.floor(Math.random() * (rsort.length - idx));
            // now swap elements at idx and swpIdx
            let tmp = rsort[idx];
            rsort[idx] = rsort[swpIdx];
            rsort[swpIdx] = tmp;
        }
        return rsort;
    }

    static getRandomInitialValuation(): Valuation {
        function beloteArrayToListPropositions(A) {
            let nbCardsPerAgent = Belote.getInitialNumberOfCardsByAgent();
            let listPropositions = [];
            for (let i = 0; i < nbCardsPerAgent; i++) {
                listPropositions.push('a' + A[i]);
            }

            for (let i = nbCardsPerAgent; i < nbCardsPerAgent * 2; i++) {
                listPropositions.push('b' + A[i]);
            }

            if (Belote.getAgents().includes('c')) {
                for (let i = nbCardsPerAgent * 2; i < nbCardsPerAgent * 3; i++) {
                    listPropositions.push('c' + A[i]);
                }
            }

            if (Belote.getAgents().includes('d')) {
                for (let i = nbCardsPerAgent * 3; i < nbCardsPerAgent * 4; i++) {
                    listPropositions.push('d' + A[i]);
                }
            }

            return listPropositions;
        }

        let A = Belote.arrayShuffle(Belote.getCardNames());
        return new Valuation(beloteArrayToListPropositions(A));
    }

    static getInitialSetWorldsFormula(): Formula {
        let formula = new AndFormula(
            Belote.getAgents().map((a) => new ExactlyFormula(Belote.getInitialNumberOfCardsByAgent(), Belote.getVarsOfAgent(a)))
        );
        let formula2 = new AndFormula(
            Belote.getCardNames().map(
                (card) =>
                    new ExactlyFormula(
                        1,
                        Belote.getAgents().map((agent) => agent + card)
                    )
            )
        );
        return new AndFormula([formula, formula2]);
    }

    static getInitialRelations(): Map<string, SymbolicRelation> {
        let R = new Map();
        for (let agent of Belote.getAgents()) {
            R.set(agent, Belote.getInitialRelation(agent));
        }
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
        for (let cardSuit of Belote.cardSuits) {
            for (let cardValue of Belote.cardValues) {
                A.push(Belote.getVar(a, cardSuit, cardValue));
            }
        }
        return A;
    }

    static getCardNames() {
        let A = [];
        for (let cardSuit of Belote.cardSuits) {
            for (let cardValue of Belote.cardValues) {
                A.push(cardSuit + cardValue);
            }
        }
        return A;
    }

    getName() {
        return 'Belote';
    }

    getDescription(): string[] {
        return [
            'This example is a simplification of the belote game (see https://en.wikipedia.org/wiki/Belote).',
            '',
            'Each player has 3 cards, whose value is either 1, 7 or K, and whose suit is either spade, diamond, clover, or heart.'
        ];
    }

    getInitialEpistemicModel() {
        let example = this;

        class SEModelDescriptorFormulaBelote implements SEModelDescriptor {
            getAtomicPropositions(): string[] {
                return example.getAtomicPropositions();
            }

            getAgents(): string[] {
                return Belote.getAgents();
            }

            getSetWorldsFormulaDescription(): Formula {
                return Belote.getInitialSetWorldsFormula();
            }

            getRelationDescription(agent: string): SymbolicRelation {
                return Belote.getInitialRelations().get(agent);
            }

            getPointedValuation(): Valuation {
                return Belote.getRandomInitialValuation();
            }
        }

        let valToWorld = (val: Valuation): WorldValuation => {
            return new BeloteWorld(val);
        };

        return new SymbolicEpistemicModelTouist(valToWorld, new SEModelDescriptorFormulaBelote());
    }

    getAtomicPropositions(): string[] {
        let A = [];
        for (let agent of Belote.getAgents()) {
            for (let cardSuit of Belote.cardSuits) {
                for (let cardValue of Belote.cardValues) {
                    A.push(Belote.getVar(agent, cardSuit, cardValue));
                }
            }
        }
        return A;
    }

    getWorldExample() {
        return new BeloteWorld(Belote.getRandomInitialValuation());
    }

    getActions() {
        return [];
    }
}
