import { Environment } from './../environment/environment';
import { ActionSetEpistemicModel } from './../environment/action-set-epistemic-model';
import { Action } from './../environment/action';
import { SymbolicPublicAction } from './../eventmodel/symbolic-public-action';
import { Valuation } from './../epistemicmodel/valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { SimpleWorld } from './simple';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { World } from '../epistemicmodel/world';

export class CommonknowledgeStrictlyMoreExpressive extends ExampleDescription {
    getDescription(): string {
        throw new Error("Method not implemented.");
    }
    getAtomicPropositions(): string[] {
        return ["p"];
    }

    readonly d = 4;
    getName() {
        return "Language with Common knowledge is more expressive";
    }

    getModel(lastPTrue: boolean) {
        let M = new ExplicitEpistemicModel();

        for (let i = 0; i < this.d; i++)
            M.addWorld("w" + i, new SimpleWorld(new Valuation(["p"])));

        if (lastPTrue)
            M.addWorld("w" + this.d, new SimpleWorld(new Valuation(["p"])));
        else
            M.addWorld("w" + this.d, new SimpleWorld(new Valuation([])));

        M.makeReflexiveRelation("a");
        M.makeReflexiveRelation("b");
        for (let i = 0; i < this.d; i++)
            M.addEdge(i % 2 == 0 ? "a" : "b", "w" + i.toString(), "w" + (i + 1).toString());
        M.makeSymmetricRelation("a");
        M.makeSymmetricRelation("b");

        M.setPointedWorld("w0");
        return M;
    }


    getInitialEpistemicModel(): import("../epistemicmodel/epistemic-model").EpistemicModel {
        return this.getModel(true);
    }

    getActions() {
        return [new ActionSetEpistemicModel({
            name: "epistemic state of depth " + this.d + " with CK p",
            epistemicModel: this.getModel(true)
        }),
        new ActionSetEpistemicModel({
            name: "epistemic state with p false at modal depth " + this.d,
            epistemicModel: this.getModel(false)
        })];
    }
    getWorldExample(): World {
        return new SimpleWorld(new Valuation(["p"]));
    }
    onRealWorldClick(env: Environment, point: any): void {
        
    }

}
