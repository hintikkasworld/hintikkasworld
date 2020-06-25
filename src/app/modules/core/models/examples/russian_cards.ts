'use strict';

import { WorldValuation } from '../epistemicmodel/world-valuation';
import { Valuation } from '../epistemicmodel/valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Action } from '../environment/action';

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
                WorldValuation.drawCard(context, { x: this.agentPos['c'].x, y: yCards, w: 16, text: i });
            }
        }

        for (let a of ['a', 'b']) {
            for (let i = 0; i <= 4; i++) {
                for (let j = i + 1; j <= 5; j++) {
                    for (let k = j + 1; k <= 6; k++) {
                        if (this.modelCheck(a + i) && this.modelCheck(a + j) && this.modelCheck(a + k)) {
                            WorldValuation.drawCard(context, { x: this.agentPos[a].x - 13, y: yCards, w: 16, text: i });
                            WorldValuation.drawCard(context, { x: this.agentPos[a].x, y: yCards, w: 16, text: j });
                            WorldValuation.drawCard(context, { x: this.agentPos[a].x + 13, y: yCards, w: 16, text: k });
                        }

                    }
                }
            }
        }

    }
}

export class RussianCards extends ExampleDescription {
    public c0, c1, c2, c3, c4, c5, c6, c7;

    getActions(): Action[] {
        let actionAgivesSeveralPossibleHands = () => getActionModelPublicAnnouncement('(K a ((a' + c1 + ' and a' + c2 + ' and a' + c3 + ') or (a' + c1 + ' and a' + c4 + ' and a' + c0 + ') or (a' + c3 + ' and a' + c6 + ' and a' + c0 + ') or (a' + c2 + ' and a' + c5 + ' and a' + c0 + ') or (a' + c3 + ' and a' + c4 + ' and a' + c5 + ') or (a' + c1 + ' and a' + c5 + ' and a' + c6 + ') or (a' + c2 + ' and a' + c4 + ' and a' + c6 + ')))');

        return [{
            label: 'Agent a says that his hand is one of the following ' + c1 + c2 + c3 + ', ' + c1 + c4 + c0 + ', ' + c3 + c6 + c0 + ', ' + c2 + c5 + c0 + ', ' + c3 + c4 + c5 + ', ' + c1 + c5 + c6 + ', ' + c2 + c4 + c6 + '.',
            actionModel: actionAgivesSeveralPossibleHands(),
            message: 'My hand is one of these',
            saidby: 'a'
        }

            , {
                label: 'Agent b says agent c\'s card.',
                precondition: '(K b c' + c0 + ')',
                actionModel: getActionModelPublicAnnouncement('(K b c' + c0 + ')'),
                message: 'The card of agent c is ' + c0,
                saidby: 'b'
            }];
    }

    getAtomicPropositions(): string[] {
        return [];
    }

    getDescription(): string[] {
        return ['This example shows how agents a and b can communicate publicly so that they commonly know their hands, whereas agent c does not know.'];
    }

    getInitialEpistemicModel(): EpistemicModel {
        return undefined;
    }

    getName() {
    }

}

function setExampleRussianCards() {
    var c0, c1, c2, c3, c4, c5, c6, c7;

    function getExampleRussianCards() {

        let M = new EpistemicModel();

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
                                    M.addWorld('w' + ic + ia1 + ia2 + ia3 + ib[0] + ib[1] + ib[2], new RussianCardsWorld(['c' + ic, 'a' + ia1, 'a' + ia2, 'a' + ia3, 'b' + ib[0], 'b' + ib[1], 'b' + ib[2]]));
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

        //création des Edges => deux mondes sont reliés par l'agent c si c a la meme carte dans les deux mondes,
        // par l'agent a si a a la meme main dans les deux mondes, par l'agent b si b a la meme main dans les deux mondes.
        agents.forEach(a =>
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
        c0 = c;
        c1 = maina[0];
        c2 = maina[1];
        c3 = maina[2];
        c4 = mainb[0];
        c5 = mainb[1];
        c6 = mainb[2];

        return M;

    }

    M = getExampleRussianCards();


}
