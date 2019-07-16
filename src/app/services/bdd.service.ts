import { Formula } from './../modules/core/models/formula/formula';
import * as types from './../modules/core/models/formula/formula';
//import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Valuation } from '../modules/core/models/epistemicmodel/valuation';

import * as Module from "./../../../cuddjs/release/cuddjs.js";
import "!!file-loader?name=wasm/cuddjs.wasm2!./../../../cuddjs/release/cuddjs.wasm2";
//wasm/cuddjs.wasm is the "virtual" name


export type BDDNode = number;
type BDDAtom = number;
type pointer = number;


/*@Injectable({
  providedIn: 'root'
})*/

export class BddService {

  bddModule: any;

  atomIndex: Map<string, BDDAtom> = new Map();
  indexAtom: Map<BDDAtom, string> = new Map();

  wasmReady = new BehaviorSubject<boolean>(false);

  aliveBdds: Map<BDDNode, number> = new Map();


  constructor(f: () => void) {
    this.instantiateWasm("wasm/cuddjs.wasm2", f).catch(e => {
      //alert("Problem initializing WASM module, maybe the browser does not have enough memory?");
      console.log("problem instantiate wasm")
      throw e;
    });
  }

  //   private isAlive(bdd: BDDNode): boolean {
  //     if (this.aliveBdds.has(bdd)) {
  //       if (this.aliveBdds.get(bdd) > 0) {
  //         return true;
  //       }
  //       this.aliveBdds.delete(bdd);
  //     }
  //     return false;
  //   }
  //   private killArgs(bdds: BDDNode[]): void {
  //     for (const bdd of bdds) {
  //       //TODO unfinished
  //     }
  //   }


  private async instantiateWasm(url: string, f: () => void) {
    // fetch the wasm file
    const wasmFile = await fetch(url);

    // convert it into a binary array
    const buffer = await wasmFile.arrayBuffer();
    const binary = new Uint8Array(buffer);

    // create module arguments
    // including the wasm-file
    const moduleArgs = {
      wasmBinary: binary,
      onRuntimeInitialized: () => {
        this.bddModule._init();
        this.bddModule._set_debug_mode(false);
        f();
        this.wasmReady.next(true);

      }
    };

    // instantiate the module
    this.bddModule = Module(moduleArgs);
  }

  private mallocPointerArray(array: number[]): pointer {
    /* build a typed array */
    const data = new Int32Array(array);

    /* copy it in the module heap */
    const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    const dataPtr = this.bddModule._malloc(nDataBytes);
    // TODO find a way to check that the malloc has succeeded…
    const dataHeap = new Uint8Array(this.bddModule.HEAPU8.buffer, dataPtr, nDataBytes);
    dataHeap.set(new Uint8Array(data.buffer));

    return dataHeap.byteOffset;
  }

  private mallocAtomArray(atomArray: string[]): pointer {
    return this.mallocPointerArray(<number[]>atomArray.map(a => this.getIndexFromAtom(a)));
  }

  private mallocNodeArray(nodeArray: BDDNode[]): pointer {
    return this.mallocPointerArray(<number[]>nodeArray);
  }

  private free(p: pointer) {
    this.bddModule._free(p);
  }

  private makeNewAtom(): BDDAtom {
    return this.bddModule._make_new_atom();
  }

  private getIndexFromAtom(a: string): BDDAtom {
    if (!this.atomIndex.has(a)) {
      let i = this.makeNewAtom();
      this.atomIndex.set(a, i);
      this.indexAtom.set(i, a);
    }
    return this.atomIndex.get(a);
  }

  private getAtomFromIndex(i: BDDAtom): string {
    return this.indexAtom.get(i);
  }

  /**
   * @return the number of nodes in the given BDD
   */
  getSize(b: BDDNode): number {
    return this.bddModule._get_size(b);
  }

  isTrue(b: BDDNode): boolean {
    return this.bddModule._is_true(b);
  }

  isFalse(b: BDDNode): boolean {
    return this.bddModule._is_false(b);
  }

  isConsistent(b: BDDNode): boolean {
    return this.bddModule._is_consistent(b);
  }

  areEquivalent(b: BDDNode, b2: BDDNode): boolean {
    return this.bddModule._are_equivalent(b, b2);
  }

  isInternalNode(b: BDDNode): boolean {
    return this.bddModule._is_internal_node(b);
  }

  createTrue(): BDDNode {
    return this.bddModule._create_true();
  }

  createFalse(): BDDNode {
    return this.bddModule._create_false();
  }

  applyAnd(b: BDDNode[]): BDDNode {
    // console.log("Will apply and to this array of BDDs:", b.map(b => this.nodeToString(b)));
    let result = this.createTrue();
    for (let i = 0; i < b.length; i++) {
      // console.log(`Will conjoin ${this.nodeToString(result)} with ${this.nodeToString(b[i])}`);
      result = this.bddModule._apply_and(result, b[i]);
      // console.log("applied ", i+1, " ANDs out of ", b.length);
    }
    return result;
  }

  applyOr(b: BDDNode[]): BDDNode {
    // console.log("Will apply OR to this array of BDDs:", b.map(b => this.nodeToString(b)));
    let result = this.createFalse();
    for (let i = 0; i < b.length; i++) {
      // console.log(`Will disjoin ${this.nodeToString(result)} with ${this.nodeToString(b[i])}`);
      result = this.bddModule._apply_or(result, b[i]);
      // console.log("applied ", i+1, " ORs out of ", b.length);
    }
    return result;
  }

  applyNot(b: BDDNode): BDDNode {
    return this.bddModule._apply_not(b);
  }

  applyImplies(b1: BDDNode, b2: BDDNode): BDDNode {
    return this.bddModule._apply_implies(b1, b2);
  }

  applyEquiv(b1: BDDNode, b2: BDDNode): BDDNode {
    return this.bddModule._apply_equiv(b1, b2);
  }

  createLiteral(a: string): BDDNode {
    let i = this.getIndexFromAtom(a);
    return this.bddModule._create_literal(i);
  }

  applyIte(bIf: BDDNode, bThen: BDDNode, bElse: BDDNode): BDDNode {
    return this.bddModule._apply_ite(bIf, bThen, bElse);
  }

  applyExistentialForget(b: BDDNode, atoms: string[]): BDDNode {
    let ptr = this.mallocAtomArray(atoms);
    let res = this.bddModule._apply_existential_forget(b, ptr, atoms.length);
    this.free(ptr);
    return res;
  }

  applyUniversalForget(b: BDDNode, atoms: string[]): BDDNode {
    let ptr = this.mallocAtomArray(atoms);
    let res = this.bddModule._apply_universal_forget(b, ptr, atoms.length);
    this.free(ptr);
    return res;
  }


  applyConditioning(b: BDDNode, assignment: { [p: string]: boolean }): BDDNode {
    const cube = this.createCube(assignment);
    // console.log("Will apply conditioning on " + this.nodeToString(b) + " with assignment " + assignment + "(cube = " + this.nodeToString(cube) + ")");
    let res = this.bddModule._apply_conditioning(b, cube);
    // console.log(res);
    // console.log("end applyConditioning", this.nodeToString(res));
    return res;
  }

  applyRenaming(b: BDDNode, renaming: Map<string, string>) {
    const oldvars: string[] = [];
    const newvars: string[] = [];
    for (const [o, n] of Array.from(renaming.entries())) {
      oldvars.push(o);
      newvars.push(n);
    }

    const oldvarsPtr = this.mallocAtomArray(oldvars);
    const newvarsPtr = this.mallocAtomArray(newvars);

    const res = this.bddModule._apply_renaming(b, oldvarsPtr, newvarsPtr, oldvars.length);

    this.free(oldvarsPtr);
    this.free(newvarsPtr);
    return res;
  }

  getAtomOf(b: BDDNode): string {
    let i = this.bddModule._get_atom_of(b);
    return this.getAtomFromIndex(i);
  }

  getThenOf(b: BDDNode): BDDNode {
    return this.bddModule._get_then_of(b);
  }

  getElseOf(b: BDDNode): BDDNode {
    return this.bddModule._get_else_of(b);
  }


  private nodeForWhichRatioCacheIsValid = null;
  private randomSolutionRatioCache = null;
  private initRatioCache(node: BDDNode) {
    if (node !== this.nodeForWhichRatioCacheIsValid) {
      this.randomSolutionRatioCache = new Map<BDDNode, number>();
      this.nodeForWhichRatioCacheIsValid = node;
    }
  }
  private getRatioYes(n: BDDNode): number {
    if (!this.isInternalNode(n)) throw new Error("No ratio of yes for constant node");
    if (this.randomSolutionRatioCache.has(n)) return this.randomSolutionRatioCache.get(n);
    const supportTot = this.support(n);
    const nbYes = this.countSolutions(this.getThenOf(n), supportTot);
    const nbNo = this.countSolutions(this.getElseOf(n), supportTot);
    const ratioYes = nbYes / (nbYes + nbNo);
    this.randomSolutionRatioCache.set(n, ratioYes);
    return ratioYes;
  }

  /**
   * 
   * @param bddNode, supposed to be a BDD that is not the FALSE leaf
   * @param atoms, supposed to be a superset of the support of bddNode
   * @returns a random valuation that satisfies bddNode
   */
  pickRandomSolution(bddNode: BDDNode, atoms: string[] = []) {
    this.initRatioCache(bddNode);
    //const DEBUGLOG = (msg, n?) => console.log(msg, n ? this.nodeToString(n) : null);
    /**
     * @param bddNode 
     * @returns an random array of atoms, such that if they are set to true and 
     * the missing atoms to false, the resulting valuation satisfies bddNode.
     */
    const pickRandomSolutionMap = (bddNode: BDDNode): Map<string, boolean> => {
      //DEBUGLOG("pick random sol from", bddNode);
      if (this.isFalse(bddNode)) throw new Error("Cannot pick a solution from FALSE");
      else if (this.isTrue(bddNode)) return new Map();
      else {
        //console.group("will recurse" + this.nodeToString(bddNode));
        const x = this.getAtomOf(bddNode);
        const yes = this.getThenOf(bddNode);
        const no = this.getElseOf(bddNode)
        //DEBUGLOG("x=" + x);
        //DEBUGLOG("then=",yes);
        //DEBUGLOG("else=",no);

        const pickYes = !!(Math.random() < this.getRatioYes(bddNode));
        const sol = pickRandomSolutionMap(pickYes ? yes : no);
        sol.set(x, pickYes);
        //                  console.log("current partial sol: ", sol);
        //                 console.groupEnd();
        return sol;
      }
    }


    /*add randomly variables that are in atoms but not in the support of bddNode (their values is not relevant)
    */
    const addRandomlyVariablesInAtomsNotInSupport = (A: Map<string, boolean>) => {
      atoms.filter(a => !A.has(a)).forEach((atom: string) => {
        A.set(atom, !!(Math.random() < 0.5));
      });
    }

    const A = pickRandomSolutionMap(bddNode);
    addRandomlyVariablesInAtomsNotInSupport(A);

    let propositions = {};
    A.forEach((value, key) => { propositions[key] = value; });
    console.log(propositions)
    return propositions;
  }

  // THIS USES CUDD, but the results do not seem uniform??
  //   // actually this is not bulletproof
  //   private randomPickerInfo = {validForNode: null, supportPointer: null, support: null };
  //   private initCuddRandomSolutionPicker(n: BDDNode) {
  //     if (n !== this.randomPickerInfo.validForNode) {
  //       this.bddModule._free(this.randomPickerInfo.supportPointer);
  //       this.randomPickerInfo.supportPointer = this.bddModule._get_pointer_to_support(n);
  //       this.randomPickerInfo.support = this.support(n);  // not very efficient… whatever
  //       this.randomPickerInfo.validForNode = n;
  //     }
  //   }
  //   //   /** this one uses cudd */
  //   pickRandomSolution(bddNode: BDDNode, atoms: string[] = []): Valuation {
  //     if (this.isFalse(bddNode)) throw new Error("Cannot pick a solution from FALSE");
  //     let sol, atomsNotInSupport;
  //     if (this.isTrue(bddNode)) {
  //       sol = new Map();
  //       atomsNotInSupport = atoms;
  //     } else {
  //       this.initCuddRandomSolutionPicker(bddNode);
  //       const cube = this.bddModule._pick_random_solution(bddNode, this.randomPickerInfo.supportPointer, this.randomPickerInfo.support.length);
  //       sol = this.cubeToAssignment(cube);
  //       this.destroy(cube);
  //       atomsNotInSupport = atoms.filter(a => ! this.randomPickerInfo.support.includes(a));
  //     }
  //     for (const a of atomsNotInSupport) {
  //       sol.set(a, !!(Math.random() < 0.5));
  //     }
  //     return Valuation.buildFromMap(sol);
  //   }



  /**
   * 
   * @param bddNode 
   * @param atoms an array of atoms, supposed to be a superset of the support of bddNode
   * @returns the number of solutions/valuations, whose support is atoms, that satisfies (i.e. makes it true) the bddNode
   *    */
  countSolutions_JS(bddNode: BDDNode, atoms?: string[]): number {
    const cache = new Map<BDDNode, { count: number, support: string[] }>();
    const countSolutionsRec = (n: BDDNode): { count: number, support: string[] } => {
      if (this.isFalse(n)) return { count: 0, support: [] };
      if (this.isTrue(n)) return { count: 1, support: [] };
      if (cache.has(n)) return cache.get(n);
      const x = this.getAtomOf(n);
      const { count: tC, support: tS } = countSolutionsRec(this.getThenOf(n));
      const { count: eC, support: eS } = countSolutionsRec(this.getElseOf(n));
      const tAtomsToAdd = eS.filter(a => !tS.includes(a));
      const tNbAtomsToAdd = tAtomsToAdd.length;
      const eNbAtomsToAdd = tS.filter(a => !eS.includes(a)).length;
      const count = tC * 2 ** tNbAtomsToAdd + eC * 2 ** eNbAtomsToAdd;
      const support = tS.concat(tAtomsToAdd);
      support.push(x);
      const res = { count, support };
      cache.set(n, res);
      return res;
    }
    const { count, support } = countSolutionsRec(bddNode);
    const atomsMinusSupport = new Set();
    if (atoms !== undefined)
      atoms.forEach((atom: string) => {
        if (!support.includes(atom)) atomsMinusSupport.add(atom);
      });
    const res = count * (2 ** atomsMinusSupport.size);

    //     /**** DEBUG ****/
    //     console.log("comparing result with cudd:");
    //     if (res !== this.countSolutionsCudd(bddNode, atoms)) throw new Error("PB!!!");
    //     /***************/

    return res;
  }

  countSolutions(bddNode: BDDNode, atoms?: string[]): number {
    const nbvars = atoms !== undefined ? atoms.length : -1;
    return this.bddModule._count_solutions(bddNode, nbvars);
  }


  nodeToString(bddNode: BDDNode, full: boolean = false): string {
    const childrenToString = n => {
      if (this.isFalse(n)) return "FALSE";
      if (this.isTrue(n)) return "TRUE";
      return full ? this.nodeToString(n, true) : `#${n}(${this.getSize(n)}n;${this.countSolutions(n)}s)`;
    };
    if (this.isInternalNode(bddNode)) {
      const v = this.getAtomOf(bddNode);
      const t = childrenToString(this.getThenOf(bddNode));
      const e = childrenToString(this.getElseOf(bddNode));
      const id = full ? '' : `#${bddNode}: `;
      return `[${id}IF ${v} THEN ${t} ELSE ${e}]`;
    } else return "[" + childrenToString(bddNode) + "]";
  }

  /**
   * CAUTION: use it only on small BDDs. Most used for debug.
   */
  pickAllSolutions(bddNode: BDDNode, atoms?: string[]): string[][] {
    return this.pickSolutions(bddNode, Infinity, atoms);
  }
  /**
   * NB: this is not efficient at all
   */
  pickSolutions(bddNode: BDDNode, max: number = 10, atoms?: string[]): string[][] {
    if (atoms === undefined) atoms = this.support(bddNode);
    const combineSols = (x: string, t: BDDNode, e: BDDNode, max: number, atoms: string[]) => {
      const sols = getSetOfTrueAtomsOf(e, max, atoms).slice();
      for (let trueAtoms of getSetOfTrueAtomsOf(t, max - sols.length, atoms)) {
        trueAtoms = trueAtoms.slice();
        trueAtoms.push(x);
        sols.push(trueAtoms);
      }
      return sols;
    }
    const getSetOfTrueAtomsOf = (n: BDDNode, max: number, atoms: string[]): string[][] => {
      // console.log("Current node: " + this.nodeToString(n));
      if (max === 0) return [];
      if (this.isFalse(n)) return [];
      if (this.isTrue(n)) {
        if (atoms.length === 0) return [[]];
        const x = atoms[0];
        return combineSols(x, n, n, max, atoms.slice(1));
      }
      const x = this.getAtomOf(n);
      const nextatoms = atoms.filter(v => v !== x);
      if (atoms.length !== nextatoms.length + 1) throw new Error("Atom " + x + " not in provided support");
      return combineSols(x, this.getThenOf(n), this.getElseOf(n), max, nextatoms);
    };
    return getSetOfTrueAtomsOf(bddNode, max, atoms);//.map(trueAtoms => new Valuation(trueAtoms));
  }


  support(bddNode: BDDNode): string[] {
    const cube: BDDNode = this.bddModule._support(bddNode);
    const support: string[] = [];
    for (let n: BDDNode = cube; this.isInternalNode(n); n = this.getThenOf(n)) {
      support.push(this.getAtomOf(n));
    }
    this.destroy(cube);
    return support;
  }

  /**
   * 
   * @param assignment an assignment (a Map) from propositions (names) to Boolean (their truth values)
   * @returns the BDD that corresponds to the conjunction of litterals that describes the assignment.
   */
  createCube(assignment: { [p: string]: boolean }): BDDNode {
    const literals = []

    for (const atom in assignment) {
      let lit = this.createLiteral(atom);
      if (assignment[atom] != true)
        lit = this.applyNot(lit);
      literals.push(lit);
    }
    return this.applyAnd(literals);
  }

  cubeToAssignment(n: BDDNode): Map<string, boolean> {
    if (this.isFalse(n)) throw new Error("FALSE is not a cube");
    if (this.isTrue(n)) return new Map<string, boolean>();
    const x = this.getAtomOf(n);
    const yes = this.getThenOf(n);
    const no = this.getElseOf(n);
    let sol;
    if (this.isFalse(yes)) {
      sol = this.cubeToAssignment(no); // it cannot be FALSE
      sol.set(x, false);
    } else {
      if (!this.isFalse(no)) throw new Error("Too many solutions: this is not a cube");
      sol = this.cubeToAssignment(yes); // it cannot be FALSE
      sol.set(x, true);
    }
    return sol;
  }

  /*
  toValuation(bddNode: BDDNode, atoms?: string[]): Valuation {
    // TODO use cubeToAssignment ?…
    const sols = this.pickSolutions(bddNode, 2, atoms);
    if (sols.length === 0) throw new Error("FALSE is not a valuation");
    if (sols.length === 1) return sols[0];
    if (sols.length === 2) throw new Error("Too many solutions: this is not a valuation");
    throw new Error("Too many solutions: this is a bug in pickSolutions()!");
  }*/

  destroy(bddNode: BDDNode): void {
    this.bddModule._destroy(bddNode);
  }

  createCopy(bddNode: BDDNode): BDDNode {
    return this.bddModule._create_copy(bddNode)
  }

  stackTrace() {
    return this.bddModule.stackTrace();
  }


  formulaStringToBDD(formulaString: string): BDDNode {
    return this.getBDDNode(types.FormulaFactory.createFormula(formulaString));
  }

  getBDDNode(phi: Formula): BDDNode {
    switch (true) {
      case (phi instanceof types.TrueFormula): return this.createTrue();
      case (phi instanceof types.FalseFormula): return this.createFalse();
      case (phi instanceof types.AtomicFormula):
        return this.createLiteral((<types.AtomicFormula>phi).getAtomicString());
      case (phi instanceof types.ImplyFormula):
        return this.applyImplies(this.getBDDNode((<types.ImplyFormula>phi).formula1), this.getBDDNode((<types.ImplyFormula>phi).formula2));
      case (phi instanceof types.EquivFormula):
        return this.applyEquiv(this.getBDDNode((<types.EquivFormula>phi).formula1), this.getBDDNode((<types.EquivFormula>phi).formula2));
      case (phi instanceof types.AndFormula):
        return this.applyAnd((<types.AndFormula>phi).formulas.map((f) => this.getBDDNode(f)));
      case (phi instanceof types.OrFormula):
        return this.applyOr((<types.OrFormula>phi).formulas.map((f) => this.getBDDNode(f)));
      case (phi instanceof types.XorFormula): {
        throw new Error("to be implemented");
      }
      case (phi instanceof types.NotFormula): return this.applyNot(this.getBDDNode((<types.NotFormula>phi).formula));
      case (phi instanceof types.KFormula): {
        throw new Error("formula should be propositional");
      }
      case (phi instanceof types.KposFormula):
        throw new Error("formula should be propositional");
      case (phi instanceof types.KwFormula): {
        throw new Error("formula should be propositional");
      }
      case (phi instanceof types.ExactlyFormula): {
        return this.createExactlyBDD((<types.ExactlyFormula>phi).count, (<types.ExactlyFormula>phi).variables);
      }
    }
    throw Error("type of phi not found");
  }




  createExactlyBDD(n: BDDNode, vars: string[]): BDDNode {

    const cache: Map<string, BDDNode> = new Map();

    const getNamongK = (n: number, k: number) => {

      const key = n + "," + k;

      if (cache.has(key)) return cache.get(key);
      if (n == 0) {
        const valuation = {};
        for (let v of vars.slice(0, k)) {
          valuation[v] = false;
        }
        cache.set(key, this.createCube(valuation));
        return cache.get(key);
      }

      if (k == 0) return this.createFalse();

      let x = this.createLiteral(vars[k - 1]);
      let bdd_1 = this.createCopy(getNamongK(n - 1, k - 1));
      let bdd_2 = this.createCopy(getNamongK(n, k - 1));
      let res = this.applyIte(x, bdd_1, bdd_2);
      cache.set(key, res);
      return res;

    }

    let res = this.createCopy(getNamongK(n, vars.length));

    cache.forEach((value, key) => {
      this.destroy(value);
    });

    return res;

  }


}



