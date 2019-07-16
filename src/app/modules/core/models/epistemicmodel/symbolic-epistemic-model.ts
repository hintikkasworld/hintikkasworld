import { ExplicitEpistemicModel } from './explicit-epistemic-model';
import { SymbolicSuccessorSet } from './symbolic-successor-set';
import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';
import { Formula, AndFormula, ExactlyFormula, NotFormula, EquivFormula, AtomicFormula, FormulaFactory, TrueFormula, KposFormula } from '../formula/formula';
import * as types from './../formula/formula';
import { BddService, BDDNode } from '../../../../services/bdd.service';
import { WorldValuationType } from './world-valuation-type';
import { SEModelDescriptor } from './descriptor/se-model-descriptor';
import { SEModelInternalDescriptor } from './descriptor/se-model-internal-descriptor';
import { BDDServiceWorkerService } from 'src/app/services/bddservice-worker.service';

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
        console.log("SymbolicEpistemicModel.constructor");
        this.worldClass = worldClass;
        this.pointedValuation = descr.getPointedValuation();
        this.agents = descr.getAgents();

        this.symbolicRelations = new Map();
        this.loadDescriptor(descr);
        console.log("end of the construction")

    }





    static getPrimedAtomicPropositions(propositionalAtoms: string[]): string[] {
        let propositionalPrimes = [];
        propositionalAtoms.forEach((value) => {
            let prime = SymbolicEpistemicModel.getPrimedVarName(value);
            propositionalPrimes.push(prime);
        });
        return propositionalPrimes;
    }

    protected pointedValuation: Valuation; //the valuation that corresponds to the pointed world
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

    /**
     * @param valuation 
     * @retuns the world that has this valuation (PS : we suppose unicity of the current world in symbolic model)
     */
    public getWorld(valuation: Valuation): WorldValuation {
        let key = valuation.toString();
        if (this.worlds[key] == undefined)
            this.worlds[key] = new this.worldClass(valuation);
        // console.log("GET WORLD", this.worlds[key], this.worlds[key].valuation)
        return this.worlds[key];
    }


    getAgents(): string[] { return this.agents; }

    /**
     * @param varName
     * @returns the name of the primed variable 
     */
    static getPrimedVarName(varName: string) { return varName + SymbolicEpistemicModel.getPrimedString(); }

    /**
     * @param varName
     * @returns the primed symbol
     */
    static getPrimedString() { return "_pr"; }

    /**
     * @param str 
     * @returns true if the variable is a prime variable
     * TODO: François says: only containing "_p" is not correct. It should finish by "_p" no?
     */
    static isPrimed(str: string) {
        return str.includes(SymbolicEpistemicModel.getPrimedString());
    }



    async getRulesAndRulesPrime(formulaSetWorlds: any): Promise<BDDNode> {
        let formulaSetWorldsPrime = formulaSetWorlds.renameAtoms((name) => { return SymbolicEpistemicModel.getPrimedVarName(name); });
        let formulaSetWorldsAndFormulaSetWorldsPrime = new AndFormula([formulaSetWorldsPrime, formulaSetWorlds]);
        return await BDDServiceWorkerService.formulaToBDD(formulaSetWorldsAndFormulaSetWorldsPrime);
    }




    /**
     * Asynchronous function to load descriptor. This is a 
     * slowest part of the program.
     * @param descr 
     */
    private async loadDescriptor(descr: SEModelDescriptor | SEModelInternalDescriptor) {
        console.log("begin loadDescriptor...");
        this.propositionalAtoms = descr.getAtomicPropositions();
        this.propositionalPrimes = SymbolicEpistemicModel.getPrimedAtomicPropositions(this.propositionalAtoms);
        // console.log("Agents of SymbolicEpistemicModel", agents);
        if ((<any>descr).getSetWorldsFormulaDescription != undefined) { //we intend  "instanceof SEModelDescriptor"
            let descriptor = <SEModelDescriptor>descr;
            //from now on, it should done asynchronously
            this.bddSetWorlds = await this.getRulesAndRulesPrime(descriptor.getSetWorldsFormulaDescription());
            for (let agent of this.agents) {
                let bddRelation: BDDNode = await descriptor.getRelationDescription(agent).toBDD();
                //this.symbolicRelations.set(agent, BDD.bddService.applyAnd([BDD.bddService.createCopy(this.bddSetWorlds), bddRelation]));
                this.symbolicRelations.set(agent, await BDDServiceWorkerService.applyAnd(
                    [await BDDServiceWorkerService.createCopy(this.bddSetWorlds), bddRelation]));
            }
        }
        else { //we intend  "instanceof SEModelInternalDescriptor"
            let descriptor = <SEModelInternalDescriptor>descr;
            this.bddSetWorlds = await descriptor.getSetWorldsBDDDescription();
            console.log("bdd worlds is: " + this.bddSetWorlds);
            for (let agent of this.agents) {
                let bddRelation: BDDNode = await descriptor.getRelationBDD(agent);
                console.log("bdd relation for agent " + agent + " is: " + bddRelation);
                this.symbolicRelations.set(agent, bddRelation);
                /* await BDDServiceWorkerService.applyAnd([await BDDServiceWorkerService.createCopy(this.bddSetWorlds),
                     bddRelation]));*/

            }
        }
        console.log("   loadDescriptor: end")
    }

    /**
    @returns the pointed world
    **/
    getPointedWorld() { return this.getWorld(this.pointedValuation); }

    getSuccessors(w: World, a: string): SymbolicSuccessorSet {
        //console.log("Solutions", sols);
        return new SymbolicSuccessorSet(this, w, a);
    };

    getAgentSymbolicRelation(agent: string): BDDNode {
        return this.symbolicRelations.get(agent);
    }

    setAgentSymbolicRelation(agent: string, bddPointer: BDDNode): void {
        this.symbolicRelations.set(agent, bddPointer);
    }

    getInitialFormula(): BDDNode {
        return this.bddSetWorlds
    }

    static getMapNotPrimeToPrime(atoms: string[]): Map<string, string> {
        let map = new Map<string, string>();
        atoms.forEach((value) => {
            map.set(value, SymbolicEpistemicModel.getPrimedVarName(value));
        });
        return map;
    }

    static getMapPrimeToNotPrime(atoms: string[]): Map<string, string> {
        let map = new Map<string, string>();
        atoms.forEach((value) => {
            map.set(SymbolicEpistemicModel.getPrimedVarName(value), value);
        });
        return map;
    }

    getPropositionalAtoms() {
        return this.propositionalAtoms;
    }

    getPropositionalPrimes() {
        return this.propositionalPrimes;
    }

    getWorldClass() { return this.worldClass; }

    /**
     * @param formula a modal formula
     * @returns true if the formula is true in the real world (the pointed one)
     */
    async check(formula: Formula): Promise<boolean> {
        let bddFormulaSemantics = await this.queryWorldsSatisfying(formula);
        let res = await BDDServiceWorkerService.applyConditioning(bddFormulaSemantics,
            this.pointedValuation.getPropositionMap());
        return await BDDServiceWorkerService.isConsistent(<BDDNode>res);
    }

    async queryWorldsSatisfying(phi: Formula): Promise<BDDNode> {

        /*  let allWorlds: BDDNode = await BDDServiceWorkerService.createFalse();
          this.symbolicRelations.forEach(async (value: BDDNode, key: string) => {
              let f2: BDDNode = await BDDServiceWorkerService.applyExistentialForget(await BDDServiceWorkerService.createCopy(value), this.propositionalPrimes);
              allWorlds = await BDDServiceWorkerService.applyOr([allWorlds, f2]);
          });*/
        let allWorlds = this.bddSetWorlds;
        return await this._query(allWorlds, phi);;
    }

    /*
    
    */
    private async _query(all_worlds: BDDNode, phi: Formula): Promise<BDDNode> {
        // console.log("Query", bdd, phi)
        if (phi instanceof types.TrueFormula) { return await BDDServiceWorkerService.createCopy(all_worlds); }
        if (phi instanceof types.FalseFormula) { return await BDDServiceWorkerService.createFalse(); }
        if (phi instanceof types.AtomicFormula) {
            // console.log("Atom ", (<types.AtomicFormula>phi).getAtomicString())
            return await BDDServiceWorkerService.applyAnd([
                await BDDServiceWorkerService.createLiteral((<types.AtomicFormula>phi).getAtomicString()),
                await BDDServiceWorkerService.createCopy(all_worlds)
            ]
            );
        }
        if (phi instanceof types.AndFormula) {
            let arrayNumber: number[] = [];
            for (let f of (<types.AndFormula>phi).formulas) {
                arrayNumber.push(await this._query(all_worlds, f));
            }
            return await BDDServiceWorkerService.applyAnd(arrayNumber);
        }
        if (phi instanceof types.OrFormula) {
            let arrayNumber: number[] = [];
            for (let f of (<types.OrFormula>phi).formulas) {
                arrayNumber.push(await this._query(all_worlds, f));
            }

            return await BDDServiceWorkerService.applyOr(arrayNumber);
        }
        if (phi instanceof types.NotFormula) {
            //console.log("Not", (<types.NotFormula>phi).formula);
            let res = await BDDServiceWorkerService.applyNot(await this._query(all_worlds, (<types.NotFormula>phi).formula));
            let res2 = await BDDServiceWorkerService.applyAnd([await BDDServiceWorkerService.createCopy(all_worlds), res]);
            return res2;
        }
        if (phi instanceof types.KFormula) {
            //console.log("KFormula", (<types.KFormula>phi).agent, (<types.KFormula>phi).formula)
            let form = new types.NotFormula(
                new types.KposFormula(
                    (<types.KFormula>phi).agent,
                    new types.NotFormula((<types.KFormula>phi).formula)
                ));
            // console.log("new form", form);
            return this._query(all_worlds, form);
        }
        if (phi instanceof types.KposFormula) {
            //console.log("Kpos")
            let mp = await BDDServiceWorkerService.applyRenaming(
                await this._query(all_worlds, (<types.KposFormula>phi).formula),
                SymbolicEpistemicModel.getMapPrimeToNotPrime(this.propositionalAtoms)
            );
            // console.log("mp", BDD.bddService.pickAllSolutions(mp));
            let bdd_a = await this.getAgentSymbolicRelation((<types.KposFormula>phi).agent);
            let bdd_and = await BDDServiceWorkerService.applyAnd([await BDDServiceWorkerService.createCopy(bdd_a), mp]);
            // console.log("bdd_and", BDD.bddService.pickAllSolutions(bdd_and).map(v => v.toAssignment(this.propositionalAtoms.concat(this.propositionalPrimes))), this.propositionalPrimes);
            let res = await BDDServiceWorkerService.applyExistentialForget(bdd_and, this.propositionalPrimes);
            // console.log("res Kpos", BDD.bddService.pickAllSolutions(res).map(v => v.toAssignment(this.propositionalAtoms)));
            return res
        }
        if (phi instanceof types.KwFormula) {
            // K p or K neg p
            let Knp = new types.KFormula(
                (<types.KwFormula>phi).agent,
                new types.NotFormula((<types.KwFormula>phi).formula)
            );
            let Kp = new types.KFormula(
                (<types.KwFormula>phi).agent,
                new types.NotFormula((<types.KwFormula>phi).formula)
            );
            return await this._query(all_worlds, new types.OrFormula([Knp, Kp]));
        }
        if (phi instanceof types.ExactlyFormula) {
            //return BDD.bddService.applyAnd([BDD.buildFromFormula(phi), BDD.bddService.createCopy(all_worlds)])
            return await this._query(all_worlds, <types.ExactlyFormula>phi.convertToNormalFormula());

        }

        /* else */
        throw new Error("Unknown instance of phi:" + JSON.stringify(phi));
    }


    /**
     * 
     * @param valuation 
     * @returns a Boolean formula, actually a conjunction of litterals that 
     * describes that valuation.
     */
    static valuationToFormula(valuation: Valuation): Formula {
        let literals = [];
        for (var proposition in valuation.propositions) {
            if (valuation.propositions[proposition]) {
                literals.push(new AtomicFormula(proposition));
            } else {
                literals.push(new NotFormula(new AtomicFormula(proposition)));
            }

        }
        // console.log("VALUATION TO FORMULA", valuation, literals)
        return new AndFormula(literals);
    }



    getInternalDescription(): SEModelInternalDescriptor {
        return {
            getAgents: () => this.agents,
            getAtomicPropositions: () => this.propositionalAtoms,
            getSetWorldsBDDDescription: async () => this.bddSetWorlds,
            getRelationBDD: async (agent: string) => this.symbolicRelations.get(agent),
            getPointedValuation: () => this.pointedValuation
        }
    }

    /**
     * @returns an explicit epistemic model that is equivalent to the symbolic one.
     * remark: should be called only if you know that the number of worlds in the symbolic model is small
     */
    toExplicit(): ExplicitEpistemicModel {
        let M = new ExplicitEpistemicModel();
        BDDServiceWorkerService.pickAllSolutions(this.bddSetWorlds, this.propositionalAtoms);
        return M;
    }



}

