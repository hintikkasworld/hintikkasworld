import { Valuation } from './../epistemicmodel/valuation';
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';
import { FormulaFactory } from './../formula/formula';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { Action } from './../environment/action';
import { ExplicitEventModel } from './../eventmodel/explicit-event-model';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';

class DiningCryptographersWorld extends WorldValuation {
    constructor(propositions) {
        super(propositions);
        this.agentPos = {};
        this.agentPos['a'] = { x: 64, y: 26, r: 16 };
        this.agentPos['b'] = { x: 16, y: 48, r: 16 };
        this.agentPos['c'] = { x: 128 - 16, y: 48, r: 16 };
    }

    drawPaid(context: CanvasRenderingContext2D, x, y) {
        context.beginPath();
        context.strokeStyle = 'black';
        context.fillStyle = 'rgb(230, 230, 200)';
        context.arc(x, y, 8, 0, Math.PI * 2);
        context.stroke();
        context.fill();

        context.fillStyle = 'black';
        context.font = '12px Verdana';
        context.fillText('$', x - 4, y + 4);
    }

    draw(context: CanvasRenderingContext2D) {
        context.clearRect(0, 0, 128, 64);
        context.fillStyle = 'blue';
        context.strokeStyle = 'blue';
        context.font = '10px Verdana';
        for (let a of ['a', 'b', 'c']) {
            for (let b of ['a', 'b', 'c']) {
                if (a < b) {
                    if (this.modelCheck('flipDone')) {
                        let bit = this.modelCheck(DiningCryptographersProblem.getPropositionSharedBit(a + b)) ? '1' : '0';
                        context.fillText(
                            bit,
                            (this.agentPos[a].x + this.agentPos[b].x) / 2,
                            (this.agentPos[a].y + this.agentPos[b].y) / 2 + 8
                        );
                    }
                    context.beginPath();
                    context.moveTo(this.agentPos[a].x, this.agentPos[a].y);
                    context.lineTo(this.agentPos[b].x, this.agentPos[b].y);
                    context.stroke();
                }
            }
        }

        this.drawAgents(context);
        context.fillStyle = 'black';
        context.font = '8px Verdana';
        for (let a of ['a', 'b', 'c']) {
            if (this.modelCheck(DiningCryptographersProblem.getPropositionPaid(a))) {
                this.drawPaid(context, this.agentPos[a].x, this.agentPos[a].y - 18);
            }
        }

        if (this.modelCheck(DiningCryptographersProblem.getPropositionPaid('nsa'))) {
            context.fillText('NSA', 16, 8);

            this.drawPaid(context, 8, 8);
        }
        if (this.modelCheck('announcementDone')) {
            for (let a of ['a', 'b', 'c']) {
                let bit = this.modelCheck(a + 'ann') ? '1' : '0';
                context.fillText(bit, this.agentPos[a].x - this.agentPos[a].r + 16, this.agentPos[a].y - 16);
            }
        }
    }
}

export class DiningCryptographersProblem extends ExampleDescription {
    static getPropositionPaid(agent: string) {
        return agent + '_paid';
    }

    static getPropositionSharedBit(agents: string) {
        return 'sharedbit_' + agents;
    }

    getDescription(): string[] {
        return [
            'Three cryptographers gather around a table for dinner. ',
            "The waiter informs them that the meal has been paid for by someone, who could be one of the cryptographers or the National Security Agency (NSA). The cryptographers respect each other's right to make an anonymous payment, but want to find out whether the NSA paid. So they decide to execute a two-stage protocol.",

            'In the first stage, every two cryptographers establish a shared one - bit secret, say by tossing a coin behind a menu so that only two cryptographers see the outcome in turn for each two cryptographers.',

            'In the second stage, each cryptographer publicly announces a bit, which is:',

            " - if they didn't pay for the meal, the exclusive OR (XOR) of the two shared bits they hold with their two neighbours,",
            ' - if they did pay for the meal, the opposite of that XOR.',
            '',

            'The three public announcements combined reveal the answer to their question. One simply computes the XOR of the three bits announced.',
            ' - If the result is 0, it implies that none of the cryptographers paid (so the NSA must have paid the bill).',
            ' - Otherwise, one of the cryptographers paid, but their identity remains unknown to the other cryptographers.',
            '',
            'See https://en.wikipedia.org/wiki/Dining_cryptographers_problem',
        ];
    }

    getAtomicPropositions(): string[] {
        return [
            DiningCryptographersProblem.getPropositionPaid('a'),
            DiningCryptographersProblem.getPropositionPaid('b'),
            DiningCryptographersProblem.getPropositionPaid('c'),
            DiningCryptographersProblem.getPropositionPaid('nsa'),
            DiningCryptographersProblem.getPropositionSharedBit('ab'),
            DiningCryptographersProblem.getPropositionSharedBit('ac'),
            DiningCryptographersProblem.getPropositionSharedBit('bc'),
        ];
    }

    getName() {
        return 'Dining cryptographers problem';
    }

    getInitialEpistemicModel(): import('../epistemicmodel/epistemic-model').EpistemicModel {
        let M = new ExplicitEpistemicModel();
        M.addWorld('wap', new DiningCryptographersWorld(new Valuation([DiningCryptographersProblem.getPropositionPaid('a')])));
        M.addWorld('wbp', new DiningCryptographersWorld(new Valuation([DiningCryptographersProblem.getPropositionPaid('b')])));
        M.addWorld('wcp', new DiningCryptographersWorld(new Valuation([DiningCryptographersProblem.getPropositionPaid('c')])));
        M.addWorld('wnsap', new DiningCryptographersWorld(new Valuation([DiningCryptographersProblem.getPropositionPaid('nsa')])));

        for (let agent of ['a', 'b', 'c']) {
            M.addEdgeIf(
                agent,
                (world1, world2) =>
                    world1.modelCheck(DiningCryptographersProblem.getPropositionPaid(agent)) ==
                    world2.modelCheck(DiningCryptographersProblem.getPropositionPaid(agent))
            );
        }

        if (Math.random() < 0.5) {
            M.setPointedWorld('wap');
        } else {
            M.setPointedWorld('wnsap');
        } // w = 'wnsap';

        return M;
    }

    getActions() {
        class ActionFlipBitFor implements Action {
            getName(): string {
                return 'Flip the blue bits shared by two consecutive agents.';
            }

            async isApplicableIn(M: EpistemicModel): Promise<boolean> {
                return M.check(FormulaFactory.createFormula('(not flipDone)'));
            }

            perform(M: ExplicitEpistemicModel): ExplicitEpistemicModel {
                function getActionModelFlipBitFor(agents): ExplicitEventModel {
                    let E = new ExplicitEventModel();
                    let atomicProposition = DiningCryptographersProblem.getPropositionSharedBit(agents);
                    let assignment1 = {};
                    let assignment2 = {};

                    if (Math.random() < 0.5) {
                        assignment1[atomicProposition] = FormulaFactory.createTrue();
                        assignment2[atomicProposition] = FormulaFactory.createFalse();
                    } else {
                        assignment2[atomicProposition] = FormulaFactory.createTrue();
                        assignment1[atomicProposition] = FormulaFactory.createFalse();
                    }
                    assignment1['flipDone'] = FormulaFactory.createTrue();
                    assignment2['flipDone'] = FormulaFactory.createTrue();

                    E.addAction('e', FormulaFactory.createTrue(), new PropositionalAssignmentsPostcondition(assignment1));
                    E.addAction('f', FormulaFactory.createTrue(), new PropositionalAssignmentsPostcondition(assignment2));
                    E.makeReflexiveRelation('a');
                    E.makeReflexiveRelation('b');
                    E.makeReflexiveRelation('c');
                    for (let a of ['a', 'b', 'c']) {
                        if (a != agents[0] && a != agents[1]) {
                            E.addEdge(a, 'e', 'f');
                            E.addEdge(a, 'f', 'e');
                        }
                    }
                    E.setPointedAction('e');
                    return E;
                }

                let Eab = getActionModelFlipBitFor('ab');
                let Ebc = getActionModelFlipBitFor('ac');
                let Eac = getActionModelFlipBitFor('bc');

                M = Eab.apply(M);
                M = Ebc.apply(M);
                M = Eac.apply(M);

                return M;
            }
        }

        class ActionAnnouncements {
            getName(): string {
                return 'Announcements';
            }

            async isApplicableIn(M: EpistemicModel): Promise<boolean> {
                return await M.check(FormulaFactory.createFormula('(flipDone and (not announcementDone))'));
            }

            perform(M: ExplicitEpistemicModel): ExplicitEpistemicModel {
                function getActionModelPublicAnnouncementBit(agent): ExplicitEventModel {
                    let E = new ExplicitEventModel();

                    let assignment = {};
                    let atomicProposition = agent + 'ann';

                    const getPairs = (agent) => {
                        if (agent == 'a') {
                            return ['ab', 'ac'];
                        } else if (agent == 'b') {
                            return ['ab', 'bc'];
                        } else if (agent == 'c') {
                            return ['ac', 'bc'];
                        } else {
                            throw new Error('error in the public announcement');
                        }
                    };
                    const pairs = getPairs(agent);

                    const xorExpression = `(${DiningCryptographersProblem.getPropositionSharedBit(
                        pairs[0]
                    )} xor ${DiningCryptographersProblem.getPropositionSharedBit(pairs[1])})`;

                    if (M.check(FormulaFactory.createFormula(DiningCryptographersProblem.getPropositionPaid(agent)))) {
                        assignment[atomicProposition] = M.check(FormulaFactory.createFormula('(not ' + xorExpression + ')'));
                    } else {
                        assignment[atomicProposition] = M.check(FormulaFactory.createFormula(xorExpression));
                    }

                    let formula = FormulaFactory.createFormula(
                        '(' +
                            DiningCryptographersProblem.getPropositionPaid(agent) +
                            ' equiv (' +
                            assignment[atomicProposition] +
                            ' equiv (not ' +
                            xorExpression +
                            ')))'
                    );
                    assignment['announcementDone'] = 'top';
                    E.addAction('e', formula, new PropositionalAssignmentsPostcondition(assignment));
                    E.makeReflexiveRelation('a');
                    E.makeReflexiveRelation('b');
                    E.makeReflexiveRelation('c');
                    E.setPointedAction('e');
                    return E;
                }

                M = getActionModelPublicAnnouncementBit('a').apply(M);
                M = getActionModelPublicAnnouncementBit('b').apply(M);
                M = getActionModelPublicAnnouncementBit('c').apply(M);

                return M;
            }
        }

        return [new ActionFlipBitFor(), new ActionAnnouncements()];
    }

    getWorldExample(): import('../epistemicmodel/world').World {
        return new DiningCryptographersWorld(new Valuation([DiningCryptographersProblem.getPropositionPaid('a')]));
    }

    onRealWorldClick(env: import('../environment/environment').Environment, point: any): void {}
}
