import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BDDNode } from '../../../../services/bdd.service';
import { WorldValuationType } from './world-valuation-type'; 
import { AndFormula, Formula } from '../formula/formula';
import { BDD } from '../formula/bdd';
import { SymbolicRelation } from './symbolic-relation';
import { Observable, of } from 'rxjs';

export class SEModelBuilderFormula {

     /**
     * @param worldClass the type of worlds that the symbolic epistemic models returns (e.g. BeloteWorld)
     * @param agents list of agents as string
     * @param atoms list of propositional atoms describing the example
     * @param relations Map of agent: accessibility relations
     * @param rules specific rules of the game as Formula
     */
    static build(worldClass: WorldValuationType, agents: string[], atoms: string[], relations: Map<string, SymbolicRelation>, rules: Formula): Observable<SymbolicEpistemicModel> {
        let propositionalAtoms = this.initializePropositionalAtoms(atoms);
        let propositionalPrimes = this.initializePropositionalPrimes(atoms);
        let     
        this.setFormulaSetWorlds(rules).subscribe((bddRulesAndRulesPrime) => this.setRelations(relations, bddRulesAndRulesPrime));
        return of(new SymbolicEpistemicModel(relationsRestrictedToInitialFormula, worldClass, agents, propositionalAtoms, propositionalPrimes, bddRulesAndRulesPrime));
    }

    // all of these functions below are stupid functions to 
    // create a symbolic epistemic model by initialize its properties.
    // The method setFormulaSetWorlds has to be an asynchronous function
    // so that setRelations could be used first

    private static initializePropositionalAtoms(atoms: string[]) {
        let propositionalAtoms = [];
        atoms.forEach((value) => {
            propositionalAtoms.push(value);
        });
        return propositionalAtoms;
    }

    private static initializePropositionalPrimes(atoms: string[]) {
        let propositionalPrimes = [];
        atoms.forEach((value) => {
            let prime = SymbolicEpistemicModel.getPrimedVarName(value);
            propositionalPrimes.push(prime);
        });
        return propositionalPrimes;
    }

    private static setFormulaSetWorlds(rules) {
        let rulesPrime = rules.renameAtoms((name) => { return SymbolicEpistemicModel.getPrimedVarName(name); });
        let rulesAndRulesPrime = new AndFormula([rulesPrime, rules]);
        return of(BDD.buildFromFormula(rulesAndRulesPrime));
    }

    private static setRelations(relations, bddRulesAndRulesPrime): Map<string, BDDNode>{
        let relationsRestrictedToInitialFormula = new Map<string, BDDNode>();
        relations.forEach((value: SymbolicRelation, key: string) => {
            console.log("Starting the computation of the BDD of the symbolic Relation for " + key + "...");
            let bddRelation = value.toBDD();
            console.log("Computation of the BDD of the symbolic Relation for " + key + " finished!");
            relationsRestrictedToInitialFormula.set(key, BDD.bddService.applyAnd([BDD.bddService.createCopy(bddRulesAndRulesPrime), bddRelation]));
            console.log("Computation of the BDD ofthe mix with the rules BDD for the symbolic Relation for " + key + " finished!");
        });
        // console.log("Symbolic Relations", relations, "=>", relationsRestrictedToInitialFormula);
        console.log("Symbolic relations processed!");
        return relationsRestrictedToInitialFormula;
    }


}