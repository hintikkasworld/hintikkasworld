import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';


export class SymbolicEpistemicModel implements EpistemicModel{
    /**
     * Implementation d'un Modele Epistemique Symbolique
     * Ici via des BDD, et Cudd
     */

     /*********
      * STATIC
      *********/
     
    /**
     * Retourne la nom d'une variable en le nom prime
     * @param varName
     */
     static getPrimedVarName(varName:string){
        return varName + "_p";
    }

    protected pointed: any;
    protected propositionalAtoms:string[];
    protected mapAtomDDNode:Map<string, number>;

    protected graphe: number;

    /**
     * 
     * @param atoms liste des atomes propositionnels decrivant l'exemple
     * @param relations Map d'un agent vers ses relations d'accessibilite
     */
    constructor(atoms:string[], relations:Map<number, SymbolicRelation>){
        this.pointed = null;
        
        this.propositionalAtoms = [];
        atoms.forEach(function (value) {
            this.propositionalAtoms.push(value);
            this.propositionalAtoms.push(SymbolicEpistemicModel.getPrimedVarName(value));
        });

        
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
        /**
         * 
         */
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
        /* Creation de toutes les variables getVarName */
        let variables:string[] = [];

        this.agents.forEach(function (agent) {
            for(var i = 0; i<this.nbCards; i++) {
                variables.push(this.getVarName(i, agent))
            }
        });
        
        /* Cree l'Obs <<SymbolicRelation>> qui represente 
        les relations pour chaque agent var_a_c <-> var_a_c_p */
        var relationsSymboliques:Map<number, SymbolicRelation>; 

        this.agents.forEach(function (agent) {
            let agentVariables= [];
            for(var i = 0; i<this.nbCards; i++) {
                agentVariables.push(this.getVarName(i, agent))
            }
            relationsSymboliques[agent] = new Obs(agentVariables);
        });
        
        let M = new SymbolicEpistemicModel(variables, relationsSymboliques);

        M.setPointedWorld(null);

        return M;
    }


    getActions() { return []; }

}