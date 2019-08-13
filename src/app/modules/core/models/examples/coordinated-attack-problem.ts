import { Action } from './../environment/action';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { SimpleWorld } from './simple';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { WorldValuation } from '../epistemicmodel/world-valuation';


export class CoordinatedAttackProblemWorld extends WorldValuation {
    static swordImg = SimpleWorld.getImage("sword.png");


    constructor(valuation) {
        super(valuation);
        this.agentPos["a"] = { x: 24, y: 32, r: 24 };
        this.agentPos["b"] = { x: 128 - 24, y: 32, r: 24 };
        this.agentPos["c"] = undefined;
    }

    draw(context) {
        this.drawAgents(context);
        if (this.modelCheck(CoordinatedAttackProblem.proposition))
            context.drawImage(CoordinatedAttackProblemWorld.swordImg, 20, -0, 48, 48);
    }

}



export class CoordinatedAttackProblem extends ExampleDescription {
    static proposition = "p";
    depth = 0;

    getAtomicPropositions(): string[] {
        return [CoordinatedAttackProblem.proposition];
    }

    getName() {
        return "Coordinated Attack Problem";
    }

    static getEpistemicModel(depth: number) {
        let M = new ExplicitEpistemicModel();
        for (let i = 0; i <= depth; i++)
            M.addWorld("w" + i, new CoordinatedAttackProblemWorld(new Valuation([CoordinatedAttackProblem.proposition])));

        M.addWorld("w" + (depth + 1), new CoordinatedAttackProblemWorld(new Valuation([])));
        M.makeReflexiveRelation("a");
        M.makeReflexiveRelation("b");
        for (let i = depth; i >= 0; i -= 2)
            M.addEdgesCluster("b", ["w" + i, "w" + (i + 1)]);

        for (let i = depth - 1; i >= 0; i -= 2)
            M.addEdgesCluster("a", ["w" + i, "w" + (i + 1)]);

        M.setPointedWorld("w0");
        return M;
    }

    getInitialEpistemicModel(): EpistemicModel {
        return CoordinatedAttackProblem.getEpistemicModel(0);
    }


    getDescription(): string[] {
        return ["The coordinated attack problem shows that common knowledge is not reachable."];
    }

    getActions() {
        class CoordinatedAttackProblemAtoB implements Action {
            getName(): string {
                return "agent a send the message to b";
            }

            async isApplicableIn(M: EpistemicModel): Promise<boolean> {
                return await ((<ExplicitEpistemicModel>M).getNodesNumber()) % 2 == 0;
            }

            perform(M: EpistemicModel): EpistemicModel {
                return CoordinatedAttackProblem.getEpistemicModel((<ExplicitEpistemicModel>M).getNodesNumber() - 1);
            }
        }

        class CoordinatedAttackProblemBtoA implements Action {
            getName(): string {
                return "agent b send the message to a";
            }

            async isApplicableIn(M: EpistemicModel): Promise<boolean> {
                return await ((<ExplicitEpistemicModel>M).getNodesNumber()) % 2 == 1;
            }

            perform(M: EpistemicModel): EpistemicModel {
                return CoordinatedAttackProblem.getEpistemicModel((<ExplicitEpistemicModel>M).getNodesNumber() - 1);
            }
        }

        return [new CoordinatedAttackProblemAtoB(), new CoordinatedAttackProblemBtoA()];
    }


}
