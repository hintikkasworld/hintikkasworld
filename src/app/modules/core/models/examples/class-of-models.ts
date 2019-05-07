import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { SimpleWorld } from './simple';
import { Valuation } from './../epistemicmodel/valuation';
import { ActionSetEpistemicModel } from './../environment/action-set-epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from '../epistemicmodel/world';

export class ClassOfModels  extends ExampleDescription {
    getName() {
        return "Classes of models";
    }



    getModelK() {
        let M = new ExplicitEpistemicModel();

        M.addWorld("w", new SimpleWorld(new Valuation(["p"])));
        M.addWorld("wa", new SimpleWorld(new Valuation([""])));

        M.addEdge("a", "w", "wa");
        M.setPointedWorld("w");
        return M;
    }

    getModelKT() {
        let M = this.getModelK();
        M.makeReflexiveRelation("a");
        M.makeReflexiveRelation("b");
        return M;
    }


    getModelKD45() {
        let M = this.getModelK();
        M.addWorld("wb", new SimpleWorld(new Valuation(["p"])));
        M.addWorld("wb'", new SimpleWorld(new Valuation([])));
        M.addEdge("b", "w", "wb");
        M.addEdge("b", "w", "wb'");
        M.addEdge("b", "wb", "wb'");
        M.addEdge("b", "wb", "wb");
        M.addEdge("b", "wb'", "wb'");
        M.addEdge("b", "wb'", "wb");

        M.addEdge("a","wa", "wa");

        
        M.addEdge("a","wa", "wa");
        M.addEdge("b","wa", "wa");

        M.addEdge("a","wb", "wb");
        M.addEdge("a","wb'", "wb'");
        
        return M;
    }

    getModelS5() {
        let M = this.getModelK();
        M.addWorld("wb", new SimpleWorld(new Valuation(["p"])));
        M.addWorld("wb'", new SimpleWorld(new Valuation([])));
        M.addEdge("b", "w", "wb");
        M.addEdge("b", "w", "wb'");
        M.addEdge("b", "wb", "wb'");
        M.addEdge("b", "wb", "wb");
        M.addEdge("b", "wb'", "wb'");
        M.addEdge("b", "wb'", "wb");

        M.makeReflexiveRelation("a");
        M.makeReflexiveRelation("b");
        M.makeSymmetricRelation("a");
        M.makeSymmetricRelation("b");

        return M;
    }

    getInitialEpistemicModel() {
        return this.getModelK();
    }

    getActions() {
        return [new ActionSetEpistemicModel({
            name: "K",
            epistemicModel: this.getModelK()
        }),
        new ActionSetEpistemicModel({
            name: "KT",
            epistemicModel: this.getModelKT()
        }),
        new ActionSetEpistemicModel({
            name: "KD45",
            epistemicModel: this.getModelKD45()
        }),
        new ActionSetEpistemicModel({
            name: "S5",
            epistemicModel: this.getModelS5()
        })];
    }
    getWorldExample(): World {
        return new SimpleWorld(new Valuation(["p"]));
    }

}
