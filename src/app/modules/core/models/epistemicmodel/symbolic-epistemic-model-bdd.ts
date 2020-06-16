import { ExplicitEpistemicModel } from './explicit-epistemic-model';
import { SymbolicSuccessorSetBDD } from './symbolic-successor-set-bdd';
import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { World } from './world';
import { AndFormula, Formula } from '../formula/formula';
import * as types from './../formula/formula';
import { BDDNode } from '../../../../services/bdd.service';
import { SEModelDescriptor } from './descriptor/se-model-descriptor';
import { SEModelBddDescriptor } from './descriptor/se-model-bdd-descriptor';
import { BDDWorkerService } from 'src/app/services/bddworker.service';
import { BehaviorSubject } from 'rxjs';

/**
 * it implements an epistemic model described symbolically by means of BDDs
 */
export class SymbolicEpistemicModelBDD implements EpistemicModel {
    private _isLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private pointedValuation: Valuation; // the valuation that corresponds to the pointed world
    private propositionalAtoms: string[];
    private propositionalPrimes: string[];

    private bddSetWorlds: BDDNode;
    private readonly agents: string[];

    private readonly valToWorld: (val: Valuation) => WorldValuation;

    /**
     * Store for each agent the corresponding BDDNode
     * this.symbolicRelations[a] represents the relation ---- a --> = {(w, u') | w -- a --> u'}
     */
    private symbolicRelations: { [agent: string]: BDDNode };

    /**
     * stores the worlds (that are of type WorldValuation) that the user already asked for.
     * keys are strings (from a valuation, you call valuation.toString() to get the key... hhmm.. still a bit weird
     * but I do not know how to improve it yet)
     * values are the worlds themselves.
     */
    private worlds: { [val: string]: WorldValuation } = {};

    /**
     * There are two way to create a symbolic epistemic model.
     * In both way, we need to create descriptor class implementing
     * either SEModelDescriptor or SEModelInternalDescriptor.
     * SEModelDescriptor provides methods to build a symbolic epistemic
     * model from crash. SEModelInternalDescriptor in the other hand
     * consists of accessors to get information directly from the memory.
     * SEModelDescriptor are used mainly to initialize initial model for
     * symbolic examples. SEModelInternalDescriptor is used in the
     * clone a model.
     * For more example, please check symbolic models like belote or minesweeper
     * @param valToWorld a function to transform a valuation into the symbolic world
     * @param descr a descriptor to initialize every
     */
    constructor(valToWorld: (val: Valuation) => WorldValuation, descr: SEModelDescriptor | SEModelBddDescriptor) {
        this.valToWorld = valToWorld;
        this.pointedValuation = descr.getPointedValuation();
        this.agents = descr.getAgents();

        this.symbolicRelations = {};
        this.loadDescriptor(descr);
    }

    /**
     * @param varName
     * @returns the name of the primed variable
     */
    static getPrimedVarName(varName: string) {
        return varName + SymbolicEpistemicModelBDD.getPrimedString();
    }

    /**
     * @param varName
     * @returns the primed symbol
     */
    static getPrimedString() {
        return '_pr';
    }

    static getMapNotPrimeToPrime(atoms: string[]): { [p: string]: string } {
        let map = {};
        for (const value of atoms) {
            map[value] = SymbolicEpistemicModelBDD.getPrimedVarName(value);
        }
        return map;
    }

    static getMapPrimeToNotPrime(atoms: string[]): { [p: string]: string } {
        let map = {};
        for (const value of atoms) {
            map[SymbolicEpistemicModelBDD.getPrimedVarName(value)] = value;
        }
        return map;
    }

    getRelationBDD(agent: string): number {
        return this.symbolicRelations[agent];
    }

    /**
     * @param valuation
     * @retuns the world that has this valuation (PS : we suppose unicity of the current world in symbolic model)
     */
    public getWorld(valuation: Valuation): WorldValuation {
        let key = valuation.toString();
        if (this.worlds[key] == undefined) {
            this.worlds[key] = this.valToWorld(valuation);
        }
        return this.worlds[key];
    }

    async getRulesAndRulesPrime(formulaSetWorlds: Formula): Promise<BDDNode> {
        let formulaSetWorldsPrime = formulaSetWorlds.renameAtoms((name) => SymbolicEpistemicModelBDD.getPrimedVarName(name));
        let formulaSetWorldsAndFormulaSetWorldsPrime = new AndFormula([formulaSetWorldsPrime, formulaSetWorlds]);
        return await BDDWorkerService.formulaToBDD(formulaSetWorldsAndFormulaSetWorldsPrime);
    }

    async loadSuccessorBddNode(w: World, a: string): Promise<BDDNode> {
        const wValuation = await BDDWorkerService.createCube((w as WorldValuation).valuation.propositions);

        // computes {(u,v') | u --a-> v', u, v' are worlds} and {w}, i.e. {(w, v') | w --> a v', v' is a world}
        const bddRelationOnW = await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(this.symbolicRelations[a]), wValuation]);

        //computes {v' |  w --> a v', v' is a world}
        const bddSetSuccessorsWithPrime = await BDDWorkerService.applyExistentialForget(bddRelationOnW, this.propositionalAtoms);

        //computes {v |  w --> a v, v is a world} (without primes)
        return await BDDWorkerService.applyRenaming(
            bddSetSuccessorsWithPrime,
            SymbolicEpistemicModelBDD.getMapPrimeToNotPrime(this.propositionalAtoms)
        );
    }

    isLoaded(): boolean {
        return this._isLoaded.value;
    }

    isLoadedObservable(): BehaviorSubject<boolean> {
        return this._isLoaded;
    }

    getAgents(): string[] {
        return this.agents;
    }

    /**
     @returns the pointed world
     **/
    getPointedWorld() {
        return this.getWorld(this.pointedValuation);
    }

    getSuccessors(w: World, a: string): SymbolicSuccessorSetBDD {
        return new SymbolicSuccessorSetBDD((val) => this.getWorld(val), this.propositionalAtoms, this.loadSuccessorBddNode(w, a));
    }

    /**
     * @param formula a modal formula
     * @returns true if the formula is true in the real world (the pointed one)
     */
    async check(formula: Formula): Promise<boolean> {
        let bddFormulaSemantics = await this.queryWorldsSatisfying(formula);
        let res = await BDDWorkerService.applyConditioning(bddFormulaSemantics, this.pointedValuation.propositions);
        return await BDDWorkerService.isConsistent(res as BDDNode);
    }

    getInitialFormula(): BDDNode {
        return this.bddSetWorlds;
    }

    getPropositionalAtoms(): string[] {
        return this.propositionalAtoms;
    }

    async queryWorldsSatisfying(phi: Formula): Promise<BDDNode> {
        if (phi.isBoolean()) {
            return await this.queryWorldsSatisfyingBooleanFormula(phi);
        } else {
            let allWorlds = this.bddSetWorlds;
            return await this._query(allWorlds, phi);
        }
    }

    async queryWorldsSatisfyingBooleanFormula(phi: Formula): Promise<BDDNode> {
        return await BDDWorkerService.applyAnd([
            await BDDWorkerService.formulaToBDD(phi),
            await BDDWorkerService.createCopy(this.bddSetWorlds)
        ]);
    }

    getPointedValuation() {
        return this.pointedValuation;
    }

    /**
     * @returns an explicit epistemic model that is equivalent to the symbolic one.
     * remark: should be called only if you know that the number of worlds in the symbolic model is small
     */
    toExplicit(): ExplicitEpistemicModel {
        let M = new ExplicitEpistemicModel();
        BDDWorkerService.pickAllSolutions(this.bddSetWorlds, this.propositionalAtoms);
        // unimplemented yet ? Isn't used anyway at the moment
        return M;
    }

    /**
     * Asynchronous function to load descriptor. This is a
     * slowest part of the program.
     * loadDescriptor will call the worker to pass down the heavy part of constructing a binary decision diagram
     * @param descr
     */
    private async loadDescriptor(descr: SEModelDescriptor | SEModelBddDescriptor) {
        this.propositionalAtoms = descr.getAtomicPropositions();
        this.propositionalPrimes = this.propositionalAtoms.map(SymbolicEpistemicModelBDD.getPrimedVarName);

        if ((descr as any).getSetWorldsFormulaDescription != undefined) {
            // we intend  "instanceof SEModelDescriptor"
            await this.loadModelDescriptor(descr as SEModelDescriptor);
        } else {
            // we intend  "instanceof SEModelBddDescriptor"
            await this.loadModelBddDescriptor(descr as SEModelBddDescriptor);
        }

        this._isLoaded.next(true);
    }

    private async loadModelDescriptor(descr: SEModelDescriptor) {
        let descriptor = descr as SEModelDescriptor;
        // from now on, it should done asynchronously
        this.bddSetWorlds = await this.getRulesAndRulesPrime(descriptor.getSetWorldsFormulaDescription());

        for (let agent of this.agents) {
            let bddRelation: BDDNode = await BDDWorkerService.formulaToBDD(descriptor.getRelationDescription(agent).formula());
            this.symbolicRelations[agent] = await BDDWorkerService.applyAnd([
                await BDDWorkerService.createCopy(this.bddSetWorlds),
                bddRelation
            ]);
        }
    }

    private async loadModelBddDescriptor(descr: SEModelBddDescriptor) {
        let descriptor = descr as SEModelBddDescriptor;
        this.bddSetWorlds = await descriptor.getSetWorldsBDDDescription();
        for (let agent of this.agents) {
            let bddRelation: BDDNode = await descriptor.getRelationBDD(agent);
            console.log('bdd relation for agent ' + agent + ' is: ' + bddRelation);
            this.symbolicRelations[agent] = bddRelation;
        }
    }

    /**
     *
     * @param all_worlds
     * @param phi
     * @return a promise of a BDD that represents all worlds that satisfy phi
     */
    private async _query(all_worlds: BDDNode, phi: Formula): Promise<BDDNode> {
        if (phi instanceof types.TrueFormula) {
            return await BDDWorkerService.createCopy(all_worlds);
        }
        if (phi instanceof types.FalseFormula) {
            return await BDDWorkerService.createFalse();
        }
        if (phi instanceof types.AtomicFormula) {
            return await BDDWorkerService.applyAnd([
                await BDDWorkerService.createLiteral((phi as types.AtomicFormula).getAtomicString()),
                await BDDWorkerService.createCopy(all_worlds)
            ]);
        }
        if (phi instanceof types.AndFormula) {
            let arrayNumber: number[] = [];
            for (let f of (phi as types.AndFormula).formulas) {
                arrayNumber.push(await this._query(all_worlds, f));
            }
            return await BDDWorkerService.applyAnd(arrayNumber);
        }
        if (phi instanceof types.OrFormula) {
            let arrayNumber: number[] = [];
            for (let f of (phi as types.OrFormula).formulas) {
                arrayNumber.push(await this._query(all_worlds, f));
            }

            return await BDDWorkerService.applyOr(arrayNumber);
        }
        if (phi instanceof types.NotFormula) {
            let res = await BDDWorkerService.applyNot(await this._query(all_worlds, (phi as types.NotFormula).formula));
            let res2 = await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(all_worlds), res]);
            return res2;
        }
        if (phi instanceof types.KFormula) {
            let form = new types.NotFormula(
                new types.KposFormula((phi as types.KFormula).agent, new types.NotFormula((phi as types.KFormula).formula))
            );
            return this._query(all_worlds, form);
        }
        if (phi instanceof types.KposFormula) {
            let mp = await BDDWorkerService.applyRenaming(
                await this._query(all_worlds, (phi as types.KposFormula).formula),
                SymbolicEpistemicModelBDD.getMapPrimeToNotPrime(this.propositionalAtoms)
            );

            let bdd_a = this.symbolicRelations[(phi as types.KposFormula).agent];
            let bdd_and = await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(bdd_a), mp]);

            return await BDDWorkerService.applyExistentialForget(bdd_and, this.propositionalPrimes);
        }
        if (phi instanceof types.KwFormula) {
            // K p or K neg p
            let Knp = new types.KFormula((phi as types.KwFormula).agent, new types.NotFormula((phi as types.KwFormula).formula));
            let Kp = new types.KFormula((phi as types.KwFormula).agent, new types.NotFormula((phi as types.KwFormula).formula));
            return await this._query(all_worlds, new types.OrFormula([Knp, Kp]));
        }
        if (phi instanceof types.ExactlyFormula) {
            return await this._query(all_worlds, phi.convertToBddFormula());
        }

        throw new Error('Unknown instance of phi:' + JSON.stringify(phi));
    }
}
