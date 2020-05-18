import { ExplicitEpistemicModel } from './explicit-epistemic-model';
import { SymbolicSuccessorSet } from './symbolic-successor-set';
import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';
import {
    Formula,
    AndFormula,
    ExactlyFormula,
    NotFormula,
    EquivFormula,
    AtomicFormula,
    FormulaFactory,
    TrueFormula,
    KposFormula,
} from '../formula/formula';
import * as types from './../formula/formula';
import { BddService, BDDNode } from '../../../../services/bdd.service';
import { WorldValuationType } from './world-valuation-type';
import { SEModelDescriptor } from './descriptor/se-model-descriptor';
import { SEModelInternalDescriptor } from './descriptor/se-model-internal-descriptor';
import { BDDWorkerService } from 'src/app/services/bddworker.service';
import { Observable } from 'rxjs/internal/Observable';
import { BehaviorSubject } from 'rxjs';

function showJSON(json) {
    let theJSON = JSON.stringify(json);
    let uri = 'data:application/json;charset=UTF-8,' + encodeURIComponent(theJSON);
    let a = document.createElement('a');
    a.href = uri;
    a.innerHTML = "Right-click and choose 'save as...'";
    document.body.appendChild(a);
}

/**
 * it implements an epistemic model described symbolically by means of BDDs
 */
export class SymbolicEpistemicModel implements EpistemicModel {
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
     * @param worldClass
     * @param descr a descriptor to initialize every
     */
    constructor(worldClass: WorldValuationType, descr: SEModelDescriptor | SEModelInternalDescriptor) {
        console.log('SymbolicEpistemicModel.constructor');
        this.worldClass = worldClass;
        this.pointedValuation = descr.getPointedValuation();
        this.agents = descr.getAgents();

        this.symbolicRelations = new Map();
        // loadDescriptor will call the worker to pass down the heavy part of constructing
        // a binary decision diagram
        this.loadDescriptor(descr);

        console.log('end of SymbolicEpistemicModel.constructor');
    }

    private _isLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private _isLoaded = false;

    protected pointedValuation: Valuation; // the valuation that corresponds to the pointed world
    protected propositionalAtoms: string[];
    protected propositionalPrimes: string[];

    protected bddSetWorlds: BDDNode;
    protected readonly agents: string[];

    protected readonly worldClass: WorldValuationType;

    /**
     * Store for each agent the correspondant BDDNode
     */
    protected symbolicRelations: Map<string, BDDNode>;

    /**
     * stores the worlds (that are of type WorldValuation) that the user already asked for.
     * keys are strings (from a valuation, you call valuation.toString() to get the key... hhmm.. still a bit weird
     * but I do not know how to improve it yet)
     * values are the worlds themselves.
     */
    private readonly worlds = {};

    static getPrimedAtomicPropositions(propositionalAtoms: string[]): string[] {
        let propositionalPrimes = [];
        propositionalAtoms.forEach((value) => {
            let prime = SymbolicEpistemicModel.getPrimedVarName(value);
            propositionalPrimes.push(prime);
        });
        return propositionalPrimes;
    }

    /**
     * @param varName
     * @returns the name of the primed variable
     */
    static getPrimedVarName(varName: string) {
        return varName + SymbolicEpistemicModel.getPrimedString();
    }

    /**
     * @param varName
     * @returns the primed symbol
     */
    static getPrimedString() {
        return '_pr';
    }

    /**
     * @param str
     * @returns true if the variable is a prime variable
     * TODO: François says: only containing "_p" is not correct. It should finish by "_p" no?
     */
    static isPrimed(str: string) {
        return str.includes(SymbolicEpistemicModel.getPrimedString());
    }

    static getMapNotPrimeToPrime(atoms: string[]): { [p: string]: string } {
        let map = {};
        atoms.forEach((value) => {
            map[value] = SymbolicEpistemicModel.getPrimedVarName(value);
        });
        return map;
    }

    static getMapPrimeToNotPrime(atoms: string[]): { [p: string]: string } {
        let map = {};
        atoms.forEach((value) => {
            map[SymbolicEpistemicModel.getPrimedVarName(value)] = value;
        });
        return map;
    }

    /**
     *
     * @param valuation
     * @returns a Boolean formula, actually a conjunction of litterals that
     * describes that valuation.
     */
    static valuationToFormula(valuation: Valuation): Formula {
        let literals = [];
        for (let proposition in valuation.propositions) {
            if (valuation.propositions[proposition]) {
                literals.push(new AtomicFormula(proposition));
            } else {
                literals.push(new NotFormula(new AtomicFormula(proposition)));
            }
        }
        // console.log("VALUATION TO FORMULA", valuation, literals)
        return new AndFormula(literals);
    }

    getRelationBDD(agent: string): number {
        return this.symbolicRelations.get(agent);
    }

    isLoaded(): boolean {
        return this._isLoaded;
    }

    isLoadedObservable(): BehaviorSubject<boolean> {
        return this._isLoaded$;
    }

    /**
     * @param valuation
     * @retuns the world that has this valuation (PS : we suppose unicity of the current world in symbolic model)
     */
    public getWorld(valuation: Valuation): WorldValuation {
        let key = valuation.toString();
        if (this.worlds[key] == undefined) {
            this.worlds[key] = new this.worldClass(valuation);
        }
        // console.log("GET WORLD", this.worlds[key], this.worlds[key].valuation)
        return this.worlds[key];
    }

    getAgents(): string[] {
        return this.agents;
    }

    async getRulesAndRulesPrime(formulaSetWorlds: Formula): Promise<BDDNode> {
        let formulaSetWorldsPrime = formulaSetWorlds.renameAtoms((name) => SymbolicEpistemicModel.getPrimedVarName(name));
        let formulaSetWorldsAndFormulaSetWorldsPrime = new AndFormula([formulaSetWorldsPrime, formulaSetWorlds]);
        return await BDDWorkerService.formulaToBDD(formulaSetWorldsAndFormulaSetWorldsPrime);
    }

    /**
     * Asynchronous function to load descriptor. This is a
     * slowest part of the program.
     * @param descr
     */
    private async loadDescriptor(descr: SEModelDescriptor | SEModelInternalDescriptor) {
        console.log('begin loadDescriptor...');
        this.propositionalAtoms = descr.getAtomicPropositions();
        console.log('   propositionalAtoms set!');
        this.propositionalPrimes = SymbolicEpistemicModel.getPrimedAtomicPropositions(this.propositionalAtoms);
        console.log('   propositionalPrimes set!');
        // console.log("Agents of SymbolicEpistemicModel", agents);
        if ((descr as any).getSetWorldsFormulaDescription != undefined) {
            // we intend  "instanceof SEModelDescriptor"
            await this.loadModelDescriptor(descr as SEModelDescriptor);
        } else {
            // we intend  "instanceof SEModelInternalDescriptor"
            await this.loadModelInternalDescriptor(descr as SEModelInternalDescriptor);
        }

        this._isLoaded = true;
        this._isLoaded$.next(true);
    }

    private async loadModelDescriptor(descr: SEModelDescriptor) {
        let descriptor = descr as SEModelDescriptor;
        // from now on, it should done asynchronously
        this.bddSetWorlds = await this.getRulesAndRulesPrime(descriptor.getSetWorldsFormulaDescription());

        showJSON(await BDDWorkerService.getBDDJSON(this.bddSetWorlds));

        for (let agent of this.agents) {
            let bddRelation: BDDNode = await descriptor.getRelationDescription(agent).toBDD();
            // this.symbolicRelations.set(agent, BDD.bddService.applyAnd([BDD.bddService.createCopy(this.bddSetWorlds), bddRelation]));
            this.symbolicRelations.set(
                agent,
                await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(this.bddSetWorlds), bddRelation])
            );
        }
    }

    private async loadModelInternalDescriptor(descr: SEModelInternalDescriptor) {
        let descriptor = descr as SEModelInternalDescriptor;
        this.bddSetWorlds = await descriptor.getSetWorldsBDDDescription();
        for (let agent of this.agents) {
            let bddRelation: BDDNode = await descriptor.getRelationBDD(agent);
            console.log('bdd relation for agent ' + agent + ' is: ' + bddRelation);
            this.symbolicRelations.set(agent, bddRelation);
            /* await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(this.bddSetWorlds),
                 bddRelation]));*/
        }
    }

    /**
     @returns the pointed world
     **/
    getPointedWorld() {
        return this.getWorld(this.pointedValuation);
    }

    getSuccessors(w: World, a: string): SymbolicSuccessorSet {
        // console.log("Solutions", sols);
        return new SymbolicSuccessorSet(this, w, a);
    }

    getAgentSymbolicRelation(agent: string): BDDNode {
        return this.symbolicRelations.get(agent);
    }

    setAgentSymbolicRelation(agent: string, bddPointer: BDDNode): void {
        this.symbolicRelations.set(agent, bddPointer);
    }

    getInitialFormula(): BDDNode {
        return this.bddSetWorlds;
    }

    getPropositionalAtoms() {
        return this.propositionalAtoms;
    }

    getPropositionalPrimes() {
        return this.propositionalPrimes;
    }

    getWorldClass() {
        return this.worldClass;
    }

    /**
     * @param formula a modal formula
     * @returns true if the formula is true in the real world (the pointed one)
     */
    async check(formula: Formula): Promise<boolean> {
        let bddFormulaSemantics = await this.queryWorldsSatisfying(formula);
        let res = await BDDWorkerService.applyConditioning(bddFormulaSemantics, this.pointedValuation.getPropositionMap());
        return await BDDWorkerService.isConsistent(res as BDDNode);
    }

    checkBooleanFormula(phi: Formula): boolean {
        if (phi instanceof types.TrueFormula) {
            return true;
        }
        if (phi instanceof types.FalseFormula) {
            return false;
        }
        if (phi instanceof types.AtomicFormula) {
            return this.pointedValuation.isPropositionTrue((phi as types.AtomicFormula).getAtomicString());
        }
        if (phi instanceof types.AndFormula) {
            let b = true;
            for (let f of (phi as types.AndFormula).formulas) {
                if (!this.checkBooleanFormula(f)) {
                    b = false;
                    break;
                }
            }
            return b;
        }
        if (phi instanceof types.OrFormula) {
            let b = false;
            for (let f of (phi as types.OrFormula).formulas) {
                if (this.checkBooleanFormula(f)) {
                    b = true;
                    break;
                }
            }
            return b;
        }
        if (phi instanceof types.NotFormula) {
            return !this.checkBooleanFormula((phi as types.NotFormula).formula);
        }

        throw new Error('Not boolean formula phi:' + JSON.stringify(phi));
    }

    async queryWorldsSatisfying(phi: Formula): Promise<BDDNode> {
        if (phi.isBoolean()) {
            return await this.queryWorldsSatisfyingBooleanFormula(phi);
        } else {
            let allWorlds = this.bddSetWorlds;
            return await this._query(allWorlds, phi);
        }
        /*  let allWorlds: BDDNode = await BDDWorkerService.createFalse();
          this.symbolicRelations.forEach(async (value: BDDNode, key: string) => {
              let f2: BDDNode = await BDDWorkerService.applyExistentialForget(await BDDWorkerService.createCopy(value), this.propositionalPrimes);
              allWorlds = await BDDWorkerService.applyOr([allWorlds, f2]);
          });*/
    }

    async queryWorldsSatisfyingBooleanFormula(phi: Formula): Promise<BDDNode> {
        return await BDDWorkerService.applyAnd([
            await BDDWorkerService.formulaToBDD(phi),
            await BDDWorkerService.createCopy(this.bddSetWorlds),
        ]);
    }

    /*

    */
    private async _query(all_worlds: BDDNode, phi: Formula): Promise<BDDNode> {
        // console.log("Query", bdd, phi)
        if (phi instanceof types.TrueFormula) {
            return await BDDWorkerService.createCopy(all_worlds);
        }
        if (phi instanceof types.FalseFormula) {
            return await BDDWorkerService.createFalse();
        }
        if (phi instanceof types.AtomicFormula) {
            // console.log("Atom ", (<types.AtomicFormula>phi).getAtomicString())
            return await BDDWorkerService.applyAnd([
                await BDDWorkerService.createLiteral((phi as types.AtomicFormula).getAtomicString()),
                await BDDWorkerService.createCopy(all_worlds),
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
            // console.log("Not", (<types.NotFormula>phi).formula);
            let res = await BDDWorkerService.applyNot(await this._query(all_worlds, (phi as types.NotFormula).formula));
            let res2 = await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(all_worlds), res]);
            return res2;
        }
        if (phi instanceof types.KFormula) {
            // console.log("KFormula", (<types.KFormula>phi).agent, (<types.KFormula>phi).formula)
            let form = new types.NotFormula(
                new types.KposFormula((phi as types.KFormula).agent, new types.NotFormula((phi as types.KFormula).formula))
            );
            // console.log("new form", form);
            return this._query(all_worlds, form);
        }
        if (phi instanceof types.KposFormula) {
            // console.log("Kpos")
            let mp = await BDDWorkerService.applyRenaming(
                await this._query(all_worlds, (phi as types.KposFormula).formula),
                SymbolicEpistemicModel.getMapPrimeToNotPrime(this.propositionalAtoms)
            );
            // console.log("mp", BDD.bddService.pickAllSolutions(mp));
            let bdd_a = await this.getAgentSymbolicRelation((phi as types.KposFormula).agent);
            let bdd_and = await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(bdd_a), mp]);
            // console.log("bdd_and", BDD.bddService.pickAllSolutions(bdd_and).map(v => v.toAssignment(this.propositionalAtoms.concat(this.propositionalPrimes))), this.propositionalPrimes);
            let res = await BDDWorkerService.applyExistentialForget(bdd_and, this.propositionalPrimes);
            // console.log("res Kpos", BDD.bddService.pickAllSolutions(res).map(v => v.toAssignment(this.propositionalAtoms)));
            return res;
        }
        if (phi instanceof types.KwFormula) {
            // K p or K neg p
            let Knp = new types.KFormula((phi as types.KwFormula).agent, new types.NotFormula((phi as types.KwFormula).formula));
            let Kp = new types.KFormula((phi as types.KwFormula).agent, new types.NotFormula((phi as types.KwFormula).formula));
            return await this._query(all_worlds, new types.OrFormula([Knp, Kp]));
        }
        if (phi instanceof types.ExactlyFormula) {
            // return BDD.bddService.applyAnd([BDD.buildFromFormula(phi), BDD.bddService.createCopy(all_worlds)])
            return await this._query(all_worlds, phi.convertToNormalFormula() as types.ExactlyFormula);
        }

        /* else */
        throw new Error('Unknown instance of phi:' + JSON.stringify(phi));
    }

    getInternalDescription(): SEModelInternalDescriptor {
        return {
            getAgents: () => this.agents,
            getAtomicPropositions: () => this.propositionalAtoms,
            getSetWorldsBDDDescription: async () => this.bddSetWorlds,
            getRelationBDD: async (agent: string) => this.symbolicRelations.get(agent),
            getPointedValuation: () => this.pointedValuation,
        };
    }

    /**
     * @returns an explicit epistemic model that is equivalent to the symbolic one.
     * remark: should be called only if you know that the number of worlds in the symbolic model is small
     */
    toExplicit(): ExplicitEpistemicModel {
        let M = new ExplicitEpistemicModel();
        BDDWorkerService.pickAllSolutions(this.bddSetWorlds, this.propositionalAtoms);
        return M;
    }
}
