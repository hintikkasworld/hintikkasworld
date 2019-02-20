import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';


export class SymbolicEpistemicModel implements EpistemicModel {
    
    getAgents(): string[] {
        throw new Error("Method not implemented.");
    }

    protected pointed: any;

    protected propositionalAtoms:string[];

    constructor(atoms:string[]){
        this.pointed = null;
        
        this.propositionalAtoms = [];
        atoms.forEach(function (value) {
            this.propositionalAtoms.push(value);
            this.propositionalAtoms.push(value + "p");
        });
    }

    static getPrimedVarName(varName:string){
        return varName + "_p";
    }

    /**
    @returns the pointed world
    **/
   getPointedWorld() {
        return this.pointed;
   }

    /**
    @returns the pointed world
    **/
   setPointedWorld(newPointedWorld: any) {
        this.pointed = newPointedWorld;
    }

    getSuccessors(w: World, a: string){
        return null;
    };

}


export class BeloteTest extends ExampleDescription {

    /* On suppose 8 coeurs, 8 piques, 8 carreaux, et 8 trefles */
    private nbCards:number = 32;
    private agents = [1, 2, 3, 4]

    getName() { 
        return "Belote"; 
    }

    getVarName(agent:number, card:number){
        return "var_" + agent.toString() + "_" + card;
    }

    getInitialEpistemicModel() {
        let variables:string[] = [];

        this.agents.forEach(function (agent) {
            for(var i = 0; i<this.nbCards; i++) {
                variables.push(this.getVarName(i, agent))
            }
        });
        
        let M = new SymbolicEpistemicModel(variables);

        M.setPointedWorld(null);

        return M;
    }


    getActions() { return []; }

}