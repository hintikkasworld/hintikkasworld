import { Action } from '../environment/action';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { SimpleWorld } from './simple';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { WorldValuation } from '../epistemicmodel/world-valuation';

export class CoordinatedAttackProblemWorld extends WorldValuation {
    static swordImg = SimpleWorld.getImage('sword.png');
    static msgImg = SimpleWorld.getImage('enveloppe.png');
    static errorImg = SimpleWorld.getImage('explosion.png');

    constructor(valuation) {
        super(valuation);
        this.agentPos['a'] = { x: 24, y: 32, r: 24 };
        this.agentPos['b'] = { x: 128 - 24, y: 32, r: 24 };
        this.agentPos['c'] = undefined;
    }

    draw(context) {
        this.drawAgents(context);
        if (this.modelCheck(CoordinatedAttackProblem.proposition)) {
            context.drawImage(CoordinatedAttackProblemWorld.swordImg, 20, -0, 48, 48);
        }

        if (this.modelCheck(CoordinatedAttackProblem.msgReceivedByB)) {
            context.drawImage(CoordinatedAttackProblemWorld.msgImg, this.agentPos['b'].x - 24, this.agentPos['b'].y, 16, 16);
        }

        if (this.modelCheck(CoordinatedAttackProblem.msgReceivedByA)) {
            context.drawImage(CoordinatedAttackProblemWorld.msgImg, this.agentPos['a'].x + 16, this.agentPos['a'].y, 16, 16);
        }

        /** if (this.modelCheck(CoordinatedAttackProblem.msgErrorAtoB)) {
            context.drawImage(CoordinatedAttackProblemWorld.msgImg, 48, 32, 16, 16);
            context.drawImage(CoordinatedAttackProblemWorld.errorImg, 48+4, 32, 16, 16);
        }

         if (this.modelCheck(CoordinatedAttackProblem.msgErrorBtoA)) {
            context.drawImage(CoordinatedAttackProblemWorld.msgImg, 64, 32, 16, 16);
            context.drawImage(CoordinatedAttackProblemWorld.errorImg, 64-4, 32, 16, 16);
        }
         */
    }
}

export class CoordinatedAttackProblem extends ExampleDescription {
    static proposition = 'p';
    static msgReceivedByA = 'msgReceivedByA';
    static msgReceivedByB = 'msgReceivedByB';
    static msgErrorAtoB = 'msgErrorAtoB';
    static msgErrorBtoA = 'msgErrorBtoA';
    depth = 0;

    static getEpistemicModel(depth: number) {
        let M = new ExplicitEpistemicModel();

        /** if (depth == 0) {
            M.addWorld("w0", new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition])));
        }
         else if (depth > 0 && depth % 2 == 0) {
            M.addWorld("w0", new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition, CoordinatedAttackProblem.msgReceivedByA])));
            M.addWorld("w1", new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition, CoordinatedAttackProblem.msgErrorBtoA])));
        }
         else {
            M.addWorld("w0", new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition, CoordinatedAttackProblem.msgReceivedByB])));
            M.addWorld("w1", new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition, CoordinatedAttackProblem.msgErrorAtoB])));
        } */

        if (depth == 0) {
            M.addWorld('w0', new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition])));
        } else if (depth > 0 && depth % 2 == 0) {
            M.addWorld(
                'w0',
                new CoordinatedAttackProblemWorld(
                    new Valuation([CoordinatedAttackProblem.proposition, CoordinatedAttackProblem.msgReceivedByA])
                )
            );
            M.addWorld('w1', new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition])));
        } else {
            M.addWorld(
                'w0',
                new CoordinatedAttackProblemWorld(
                    new Valuation([CoordinatedAttackProblem.proposition, CoordinatedAttackProblem.msgReceivedByB])
                )
            );
            M.addWorld('w1', new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition])));
        }

        for (let i = 2; i <= depth; i++) {
            M.addWorld('w' + i, new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition])));
        }

        M.addWorld('w' + (depth + 1), new CoordinatedAttackProblemWorld(new Valuation([])));
        M.makeReflexiveRelation('a');
        M.makeReflexiveRelation('b');
        for (let i = depth; i >= 0; i -= 2) {
            M.addEdgesCluster('b', ['w' + i, 'w' + (i + 1)]);
        }

        for (let i = depth - 1; i >= 0; i -= 2) {
            M.addEdgesCluster('a', ['w' + i, 'w' + (i + 1)]);
        }

        M.setPointedWorld('w0');
        return M;
    }

    getAtomicPropositions(): string[] {
        return [CoordinatedAttackProblem.proposition];
    }

    getName() {
        return 'Coordinated Attack Problem';
    }

    getInitialEpistemicModel(): EpistemicModel {
        return CoordinatedAttackProblem.getEpistemicModel(0);
    }

    getDescription(): string[] {
        return ['The coordinated attack problem shows that common knowledge is not reachable.'];
    }

    getActions() {
        class CoordinatedAttackProblemAtoB implements Action {
            getName(): string {
                return 'agent a send the message to b';
            }

            async isApplicableIn(M: EpistemicModel): Promise<boolean> {
                return (await (M as ExplicitEpistemicModel).getNodesNumber()) % 2 == 0;
            }

            perform(M: EpistemicModel): EpistemicModel {
                return CoordinatedAttackProblem.getEpistemicModel((M as ExplicitEpistemicModel).getNodesNumber() - 1);
            }
        }

        class CoordinatedAttackProblemBtoA implements Action {
            getName(): string {
                return 'agent b send the message to a';
            }

            async isApplicableIn(M: EpistemicModel): Promise<boolean> {
                return (await (M as ExplicitEpistemicModel).getNodesNumber()) % 2 == 1;
            }

            perform(M: EpistemicModel): EpistemicModel {
                return CoordinatedAttackProblem.getEpistemicModel((M as ExplicitEpistemicModel).getNodesNumber() - 1);
            }
        }

        return [new CoordinatedAttackProblemAtoB(), new CoordinatedAttackProblemBtoA()];
    }
}
