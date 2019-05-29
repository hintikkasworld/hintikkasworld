import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BDDNode } from '../../../../services/bdd.service';
import { WorldValuationType } from './world-valuation-type'; 
import { AndFormula, Formula } from '../formula/formula';
import { BDD } from '../formula/bdd';
import { SymbolicRelation } from './symbolic-relation';
import { Observable, of, from } from 'rxjs';

export class SEModelBuilderFormula {

    private static atoms: string[];
    private static primes: string[];
    private static bddRulesAndRulesPrime: BDDNode;
    private static relationsRestrictedToInitialFormula: Map<string, BDDNode>;

     /**
     * @param worldClass the type of worlds that the symbolic epistemic models returns (e.g. BeloteWorld)
     * @param agents list of agents as string
     * @param atoms list of propositional atoms describing the example
     * @param relations Map of agent: accessibility relations
     * @param rules specific rules of the game as Formula
     */
    static build(worldClass: WorldValuationType, agents: string[], atoms: string[], relations: Map<string, SymbolicRelation>, rules: Formula): Observable<SymbolicEpistemicModel> {
        this.initializeAtomsPrimes(atoms);
        this.setFormulaSetWorlds(rules).subscribe((bddRulesAndRulesPrime) => this.bddRulesAndRulesPrime = bddRulesAndRulesPrime);
        this.setRelations(relations, this.bddRulesAndRulesPrime).subscribe((relationsRestrictedToInitialFormula) => this.relationsRestrictedToInitialFormula = relationsRestrictedToInitialFormula);
        return of(new SymbolicEpistemicModel(this.relationsRestrictedToInitialFormula, worldClass, agents, this.atoms, this.primes, this.bddRulesAndRulesPrime));
    }

    // all of these functions below are stupid functions to 
    // create a symbolic epistemic model by initialize its properties.
    // The method setFormulaSetWorlds has to be an asynchronous function
    // so that setRelations could be used first


    private static initializeAtomsPrimes(atoms: string[]) {
        this.atoms = [];
        this.primes = [];
        let to_prime = new Map();
        let not_to_prime = new Map();
        atoms.forEach((value) => {
            let prime = SymbolicEpistemicModel.getPrimedVarName(value);
            this.atoms.push(value);
            this.primes.push(prime);
            to_prime[value] = prime;
            not_to_prime[prime] = to_prime;
        });

    }

    private static setFormulaSetWorlds(rules: Formula) {
        let rulesPrime = rules.renameAtoms((name) => { return SymbolicEpistemicModel.getPrimedVarName(name); });
        let rulesAndRulesPrime = new AndFormula([rulesPrime, rules]);
        return of(BDD.buildFromFormula(rulesAndRulesPrime));
    }

    private static setRelations(relations: Map<string, SymbolicRelation>, bddRulesAndRulesPrime: BDDNode): Observable<Map<string, BDDNode>> {
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
        return of<Map<string, BDDNode>>(relationsRestrictedToInitialFormula);
    }


}