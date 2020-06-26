import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { FormulaFactory } from './../formula/formula';
import { ExplicitEventModel } from './../eventmodel/explicit-event-model';
import { EventModelAction } from './../environment/event-model-action';
'use strict';

import { WorldValuation } from '../epistemicmodel/world-valuation';
import { Valuation } from '../epistemicmodel/valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Action } from '../environment/action';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';

/**
 * @param truePropositions an array of true propositions
 * @returns a possible combination of cards
 * @example new RussianCardsWorld(["c1","a3","a5","a6","b0","b2","b4"])
 * */
class RussianCardsWorld extends WorldValuation {
    constructor(valuation: Valuation) {
        super(valuation);

        this.agentPos['a'] = { x: 22, y: 16, r: 16 };
        this.agentPos['b'] = { x: 22 + 50, y: 16, r: 16 };
        this.agentPos['c'] = { x: 100 + 16, y: 16, r: 16 };
    }

    draw(context) {
        let yCards = 48;
        this.drawAgents(context);
        context.font = '12px Verdana';
        context.strokeStyle = '#000000';

        for (let i = 0; i <= 6; i++) {
            if (this.modelCheck('c' + i)) {
                this.drawCard(context, { x: this.agentPos['c'].x, y: yCards, w: 16, text: i });
            }
        }

        for (let a of ['a', 'b']) {
            for (let i = 0; i <= 4; i++) {
                for (let j = i + 1; j <= 5; j++) {
                    for (let k = j + 1; k <= 6; k++) {
                        if (this.modelCheck(a + i) && this.modelCheck(a + j) && this.modelCheck(a + k)) {
                            this.drawCard(context, { x: this.agentPos[a].x - 13, y: yCards, w: 16, text: i });
                            this.drawCard(context, { x: this.agentPos[a].x, y: yCards, w: 16, text: j });
                            this.drawCard(context, { x: this.agentPos[a].x + 13, y: yCards, w: 16, text: k });
                        }

                    }
                }
            }
        }

    }
}

export class RussianCards extends ExampleDescription {
    private c0;
    private c1;
    private c2;
    private c3;
    private c4;
    private c5;
    private c6;
    private c7;

    getActions(): Action[] {

        return [new EventModelAction({
            name: 'Agent a says that his hand is one of the following ' + this.c1 + this.c2 + this.c3 + ', ' + this.c1 + this.c4 + this.c0 + ', ' + this.c3 + this.c6 + this.c0 + ', ' + this.c2 + this.c5 + this.c0 + ', ' + this.c3 + this.c4 + this.c5 + ', ' + this.c1 + this.c5 + this.c6 + ', ' + this.c2 + this.c4 + this.c6 + '.',
            eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula('(K a ((a' + this.c1 + ' and a' + this.c2 + ' and a' + this.c3 + ') or (a' + this.c1 + ' and a' + this.c4 + ' and a' + this.c0 + ') or (a' + this.c3 + ' and a' + this.c6 + ' and a' + this.c0 + ') or (a' + this.c2 + ' and a' + this.c5 + ' and a' + this.c0 + ') or (a' + this.c3 + ' and a' + this.c4 + ' and a' + this.c5 + ') or (a' + this.c1 + ' and a' + this.c5 + ' and a' + this.c6 + ') or (a' + this.c2 + ' and a' + this.c4 + ' and a' + this.c6 + ')))'))
        }),
        new EventModelAction({
            name: 'Agent b says agent c\'s card.',
            eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula('(K b c' + this.c0 + ')'))
        })];
    }

    getAtomicPropositions(): string[] {
        let result = [];
        ["a", "b", "c"].forEach(
            (a) => result = result.concat([0, 1, 2, 3, 4, 5, 6].map((i) => a + i.toString())));

        return result;
    }

    getDescription(): string[] {
        return ['This example shows how agents a and b can exchange publicly information in order to commonly know their hands, whereas an intruder (agent c) does not know.', "First agent a announces publicly some information about her hand. Agent b will then infer agent a' hand and also agent c' card. Agent c will not know agent a's cards.", "Then agent b simply publicly announces the card of c. Of course, agent c will not get more information. But agent c's card is sufficient for agent a to infer the hand of agent b."];
    }

    getInitialEpistemicModel(): EpistemicModel {
        let M = new ExplicitEpistemicModel();

        //Construction des 140 mondes possibles. (représentant toutes les distributions possibles de cartes)
        var pioche = new Set([0, 1, 2, 3, 4, 5, 6]);
        for (var ic = 0; ic <= 6; ic++) {
            pioche.delete(ic);
            for (var ia1 = 0; ia1 <= 4; ia1++) { //On prend les chiffres par ordre croissant car la main 123 == la main 231 == la main 321 == la main 132 == .. La premiere carte de a ne peut donc pas être plus élevée que 4
                if (pioche.has(ia1)) {
                    pioche.delete(ia1);
                    for (var ia2 = ia1 + 1; ia2 <= 5; ia2++) {
                        if (pioche.has(ia2)) {
                            pioche.delete(ia2);
                            for (var ia3 = ia2 + 1; ia3 <= 6; ia3++) {
                                if (pioche.has(ia3)) {
                                    pioche.delete(ia3);
                                    var ib = Array.from(pioche).sort();
                                    M.addWorld('w' + ic + ia1 + ia2 + ia3 + ib[0] + ib[1] + ib[2], new RussianCardsWorld(new Valuation(['c' + ic, 'a' + ia1, 'a' + ia2, 'a' + ia3, 'b' + ib[0], 'b' + ib[1], 'b' + ib[2]])));
                                    pioche.add(ia3);
                                }
                            }
                            pioche.add(ia2);
                        }
                    }
                    pioche.add(ia1);
                }
            }
            pioche.add(ic);
        }

        function getRandomIntInclusive(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        }


        //création des Edges => deux mondes sont reliés par l'agent c si c a la meme carte dans les deux mondes,
        // par l'agent a si a a la meme main dans les deux mondes, par l'agent b si b a la meme main dans les deux mondes.
        ["a", "b", "c"].forEach(a =>
            M.addEdgeIf(a,
                (w1, w2) =>
                    [0, 1, 2, 3, 4, 5, 6].map((i) => a + i)
                        .every((p) => (w1.modelCheck(p) == w2.modelCheck(p)))));

        //Création du monde pointé de départ.
        var c = getRandomIntInclusive(0, 6);
        pioche.delete(c);
        let tabpioche = Array.from(pioche);
        var mains = new Array();
        for (let i = 0; i < 6; i++) {
            mains[i] = tabpioche[getRandomInt(0, pioche.size)];
            pioche.delete(mains[i]);
            tabpioche = Array.from(pioche);
        }
        let maina = new Array(mains[0], mains[1], mains[2]).sort();
        let mainb = new Array(mains[3], mains[4], mains[5]).sort();
        M.setPointedWorld('w' + c + maina[0] + maina[1] + maina[2] + mainb[0] + mainb[1] + mainb[2]); //utilise le nom du monde...
        this.c0 = c;
        this.c1 = maina[0];
        this.c2 = maina[1];
        this.c3 = maina[2];
        this.c4 = mainb[0];
        this.c5 = mainb[1];
        this.c6 = mainb[2];

        return M;
    }

    getName() {
        return "Russian cards";
    }

}
