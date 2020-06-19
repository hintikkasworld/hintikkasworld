import { FormulaFactory } from '../formula/formula';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { EventModelAction } from '../environment/event-model-action';
import { Valuation } from '../epistemicmodel/valuation';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from '../epistemicmodel/world';

/**
 * @param truePropositions an array of true propositions. Proposition "ma" stands for "a is muddy" and "mb" stands for "b is muddy".
 * @returns a state corresponding to the muddy children puzzle
 * @example new MuddyChildrenWorld(["ma", "mb"])
 * */
export class SimpleWorld extends WorldValuation {
    static basketImg = SimpleWorld.getImage('basket.svg');
    static basketWithMarbleImg = SimpleWorld.getImage('basket_with_marble.svg');
    static proposition = 'p';

    constructor(valuation) {
        super(valuation);
        this.agentPos['a'] = { x: 24, y: 32, r: 24 };
        this.agentPos['b'] = { x: 128 - 24, y: 32, r: 24 };
        this.agentPos['c'] = undefined;
    }

    draw(context) {
        this.drawAgents(context);

        context.drawImage(SimpleWorld.basketImg, 64 - 16, 0, 32, 32);

        if (this.modelCheck(SimpleWorld.proposition)) {
            context.drawImage(SimpleWorld.basketWithMarbleImg, 64 - 16, 0, 32, 32);
        }
    }
}

export class Simple extends ExampleDescription {
    getDescription(): string[] {
        return ['Welcome to the first example. There are two agents: a red one on the left called "a" and a blue one on the right called "b". They both do not know whether the basket contains a marble or not.Note that they both know they do not know the content of the basket. ' + 'An atomic proposition denoted by p denotes the fact that the basket contains a marble.', 'Click on the agent to see their possible worlds. You may click on agents that are in possible worlds too: that is higher-order knowledge.'];
    }

    getAtomicPropositions(): string[] {
        return ['p'];
    }

    getName() {
        return 'My first example';
    }

    getInitialEpistemicModel(): EpistemicModel {
        let M = new ExplicitEpistemicModel();
        M.addWorld('w', new SimpleWorld(new Valuation([SimpleWorld.proposition])));
        M.addWorld('u', new SimpleWorld(new Valuation([])));
        M.setPointedWorld('w');
        M.addEdgesCluster('a', ['w', 'u']);
        M.addEdgesCluster('b', ['w', 'u']);
        return M;
    }

    getActions() {
        let formula = FormulaFactory.createFormula(SimpleWorld.proposition);

        return [
            new EventModelAction({
                name: 'Public announcement that there is a marble in the basket',
                eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(formula)
            }),

            new EventModelAction({
                name: 'Private announcement to agent a of the content of the basket. Agent b knows that this private announcement occurs.',
                eventModel: ExplicitEventModel.getActionModelSemiPrivateAnnouncement(formula, 'a')
            }),

            new EventModelAction({
                name: 'Private announcement to agent a that there is a marble in the basket. Agent b is ignorant about that.',
                eventModel: ExplicitEventModel.getActionModelPrivateAnnouncement(formula, 'a')
            })
        ];
    }

    getWorldExample(): World {
        return new SimpleWorld(new Valuation(['p']));
    }
}
