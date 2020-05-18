import { Valuation } from '../epistemicmodel/valuation';
import { FormulaFactory } from '../formula/formula';
import { EventModelAction } from '../environment/event-model-action';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';

class HatsWorld extends WorldValuation {
    static readonly bluehat = HatsWorld.getImage('bluehat.png');
    static readonly redhat = HatsWorld.getImage('redhat.png');
    static readonly blind = HatsWorld.getImage('blind.png');

    constructor(propositions: Valuation) {
        super(propositions);
        this.agentPos['a'] = { x: 6 + 16, y: 32 + 16, r: 16 };
        this.agentPos['b'] = { x: 48 + 16, y: 32 + 16, r: 16 };
        this.agentPos['c'] = { x: 90 + 16, y: 32 + 16, r: 16 };
    }

    draw(context) {
        this.drawAgents(context);
        context.drawImage(HatsWorld.blind, this.agentPos['c'].x - 16, 28, 32, 32);

        for (let a of ['a', 'b', 'c']) {
            if (this.modelCheck(a + 'B')) {
                context.drawImage(HatsWorld.bluehat, this.agentPos[a].x - 16, 12, 32, 32);
            }
            if (this.modelCheck(a + 'R')) {
                context.drawImage(HatsWorld.redhat, this.agentPos[a].x - 12, 10, 32, 32);
            }
        }
    }
}

export class Hats extends ExampleDescription {
    getDescription(): string[] {
        return [
            'Each agent has a hat, either blue or red. They know that there is at least one blue hat. Agents a and b do not see their own hat and agent c is blind.'
        ];
    }

    getAtomicPropositions() {
        return ['aB', 'bB', 'cB', 'aR', 'bR', 'cR'];
    }

    getWorldExample(): import('../epistemicmodel/world').World {
        return new HatsWorld(new Valuation(['aR', 'bB', 'cB']));
    }

    getName() {
        return 'Hats';
    }

    getInitialEpistemicModel(): ExplicitEpistemicModel {
        let M = new ExplicitEpistemicModel();
        M.addWorld('wBBB', new HatsWorld(new Valuation(['aB', 'bB', 'cB'])));
        M.addWorld('wBBR', new HatsWorld(new Valuation(['aB', 'bB', 'cR'])));
        M.addWorld('wBRB', new HatsWorld(new Valuation(['aB', 'bR', 'cB'])));
        M.addWorld('wRBB', new HatsWorld(new Valuation(['aR', 'bB', 'cB'])));
        M.addWorld('wRRB', new HatsWorld(new Valuation(['aR', 'bR', 'cB'])));
        M.addWorld('wBRR', new HatsWorld(new Valuation(['aB', 'bR', 'cR'])));
        M.addWorld('wRBR', new HatsWorld(new Valuation(['aR', 'bB', 'cR'])));

        M.addEdgesCluster('a', ['wBBB', 'wRBB']);
        M.addEdgesCluster('a', ['wBBR', 'wRBR']);
        M.addEdgesCluster('a', ['wBRB', 'wRRB']);
        M.addEdge('a', 'wBRR', 'wBRR');

        M.addEdgesCluster('b', ['wBBB', 'wBRB']);
        M.addEdgesCluster('b', ['wBBR', 'wBRR']);
        M.addEdgesCluster('b', ['wRBB', 'wRRB']);
        M.addEdge('b', 'wRBR', 'wRBR');

        let names = [];
        for (let name in M.getNodes()) {
            names.push(name);
        }

        M.addEdgesCluster('c', names);
        M.setPointedWorld('wBRB'); // peut aussi être BBB, RBB ou RRB.

        return M;
    }

    getActions() {
        let A = [];
        for (let a of ['a', 'b', 'c']) {
            let phi = FormulaFactory.createFormula('((not (K ' + a + ' ' + a + 'B)) and (not (K ' + a + ' ' + a + 'R)))');
            A.push(
                new EventModelAction({
                    name: 'Agent ' + a + " says he doesn't know whether his hat is red or blue.",
                    eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(phi)
                })
            );
        }
        return A;
    }

    onRealWorldClick(env: import('../environment/environment').Environment, point: any): void {}
}
