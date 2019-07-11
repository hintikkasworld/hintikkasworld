import { BDDServiceWorkerService } from './../../../../services/bddservice-worker.service';
import { SuccessorSet } from './successor-set';
import { World } from './world';
import { WorldValuationType } from './world-valuation-type';
import { Valuation } from './valuation';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BDDNode } from './bddnode';
import { WorldValuation } from './world-valuation';

export class SymbolicSuccessorSet implements SuccessorSet {

    private bdd: BDDNode;
    private atoms: string[];
    private readonly M: SymbolicEpistemicModel;
    private number: number = undefined; // number of successors (memoization)
    private finished: boolean = false;


    /**
     * stores the worlds (that are of type WorldValuation) that the user already asked for.
     * keys are strings (from a valuation, you call valuation.toString() to get the key... hhmm.. still a bit weird
     * but I do not know how to improve it yet)
     * values are the worlds themselves.
     */
    private readonly alreadyOutput = {};

    /**
     * @param valuation 
     * @retuns yes if the corresponding world has already been output
     */
    private isAlreadyBeenOutput(valuation: Valuation): boolean {
        let key = valuation.toString();
        return (this.alreadyOutput[key] != undefined);
    }

    /**
     * 
     * @param valuation 
     * declare that the (world corresponding to) valuation has already been output by getSomeSuccessors
     */
    private declareAlreadyOutput(valuation: Valuation) {
        let key = valuation.toString();
        this.alreadyOutput[key] = true;
    }


    constructor(M: SymbolicEpistemicModel, w: World, a: string) {
        this.M = M;
        this.load(w, a);
    }



    async load(w: World, a: string) {
        // console.log("getSucessors", a, this.getAgentSymbolicRelation(a))


        let wBDD = await BDDServiceWorkerService.createCube((<WorldValuation>w).valuation.getTruePropositions(), (<WorldValuation>w).valuation.getFalsePropositions());

        //    console.log("after cube")
        //console.log("cube", BDD.bddService.pickAllSolutions(bdd));
        //console.log("graphe", BDD.bddService.pickAllSolutions(this.getAgentGraphe(a)));

        let bddRelationOnW = await BDDServiceWorkerService.applyAnd([
            await BDDServiceWorkerService.createCopy(this.M.getAgentSymbolicRelation(a)),
            wBDD]);

        //  console.log("after and", BDD.bddService.pickAllSolutions(bddRelationOnW))
        //console.log("AND", BDD.bddService.pickAllSolutions(bdd_and));

        let bddSetSuccessorsWithPrime = await BDDServiceWorkerService.applyExistentialForget(
            bddRelationOnW,
            this.M.getPropositionalAtoms());

        //console.log("after forget", BDD.bddService.pickAllSolutions(bddSetSuccessorsWithPrime))
        //console.log("forget", this.propositionalAtoms, BDD.bddService.pickAllSolutions(forget));

        let bddSetSuccessors = BDDServiceWorkerService.applyRenaming(
            bddSetSuccessorsWithPrime,
            SymbolicEpistemicModel.getMapPrimeToNotPrime(this.M.getPropositionalAtoms()));


        this.bdd = await bddSetSuccessors;
        this.atoms = this.M.getPropositionalAtoms();
        //console.log("Calcul bdd sucessors", BDD.bddService.pickAllSolutions(bddSetSuccessors));

    }
    /**
     * @returns the number of successors
     */
    getNumber(): number {
       /* if (this.number == undefined) this.number = BDD.bddService.countSolutions(this.bdd, this.atoms); //memoization
        return this.number;*/
        return 0;
    }

    async getSomeSuccessors(): Promise<World[]> {
        const arrayValToArrayWorlds = (A: Valuation[]): World[] => {
            return A.map((val: Valuation) => this.M.getWorld(val));
        }

        if (this.getNumber() < 10)
            if (this.finished)
                return [];
            else {
                this.finished = true;
                return arrayValToArrayWorlds(BDDServiceWorkerService.pickAllSolutions(this.bdd, this.atoms));
            }
        else {
            const sols = [];
            for (let i = 0; i < 5; i++) {
                const val: Valuation = BDDServiceWorkerService.pickRandomSolution(this.bdd, this.atoms);
                if (!this.isAlreadyBeenOutput(val)) {
                    sols.push(val);
                    this.declareAlreadyOutput(val);
                }
            }
            return arrayValToArrayWorlds(sols);
        }
    }

    async getRandomSuccessor(): Promise<World> {
        let val: Valuation = BDDServiceWorkerService.pickRandomSolution(this.bdd, this.atoms);
        return this.M.getWorld(val);
    }

}