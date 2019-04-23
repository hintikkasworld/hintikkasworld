import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { isPlatformWorkerUi } from '@angular/common';
import { Valuation } from '../modules/core/models/epistemicmodel/valuation';

import * as Module from "./../../../cuddjs/release/cuddjs.js";
import "!!file-loader?name=wasm/cuddjs.wasm2!./../../../cuddjs/release/cuddjs.wasm2";
//wasm/cuddjs.wasm is the "virtual" name


export type BDDNode = number;
type BDDAtom = number;
type pointer = number;


@Injectable({
  providedIn: 'root'
})

export class BddService {

  bddModule: any;

  atomIndex: Map<string, BDDAtom> = new Map();
  indexAtom: Map<BDDAtom, string> = new Map();

  wasmReady = new BehaviorSubject<boolean>(false);

  aliveBdds: Map<BDDNode, number> = new Map();


  constructor(f: () => void) {
    this.instantiateWasm("wasm/cuddjs.wasm2", f).catch(e => {
      alert("Problem initializing WASM module, maybe the browser does not have enough memory?");
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

  applyConditioning(b: BDDNode, assignment: Map<string, boolean>): BDDNode {
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

  pickRandomSolution(bddNode: BDDNode, atoms?: string[]): Valuation {
    const pickRandomSolutionArray = (bddNode: BDDNode, atoms?: string[]): string[] => {
      if (atoms === undefined) atoms = this.support(bddNode);
      if (this.isFalse(bddNode)) throw new Error("Cannot pick a solution from FALSE");
      if (this.isTrue(bddNode)) {
        const sol = [];
        for (const a of atoms) {
          if (Math.random() < 0.5) sol.push(a);
        }
        return sol;
      }
      const x = this.getAtomOf(bddNode);
      let next;
      const sol = [];
      if (Math.random() < 0.5) {
        next = this.getThenOf(bddNode);
        sol.push(x);
      } else {
        next = this.getElseOf(bddNode);
      }
      return sol.concat(this.pickRandomSolution(next, atoms.filter(v => (v !== x))));
    }
    return new Valuation(pickRandomSolutionArray(bddNode, atoms));
  }

  pickOneSolution(bddNode: BDDNode, atoms?: string[]): Valuation {
    const sols = this.pickSolutions(bddNode, 1, atoms);
    if (sols.length === 0) throw new Error("No solution to pick!");
    if (sols.length !== 1) throw new Error("Too many solutions: this is a bug in pickSolutions()!");
    return sols[0];
  }

  /**
   * 
   * @param bddNode 
   * @param atoms 
   * @returns the number of solutions/valuations, whose support is atoms, that satisfies (i.e. makes it true) the bddNode
   *    */
  countSolutions(bddNode: BDDNode, atoms?: string[]): number {
    const cache = new Map<BDDNode, { count: number, support: string[] }>();
    const rec = (n: BDDNode): { count: number, support: string[] } => {
      if (this.isFalse(n)) return { count: 0, support: [] };
      if (this.isTrue(n)) return { count: 1, support: [] };
      if (cache.has(n)) return cache.get(n);
      const x = this.getAtomOf(n);
      const { count: tC, support: tS } = rec(this.getThenOf(n));
      const { count: eC, support: eS } = rec(this.getElseOf(n));
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
    const { count, support } = rec(bddNode);
    const atomsToAdd = new Set();
    if (atoms !== undefined) {
      support.forEach(a => {
        if (!atoms.includes(a)) throw new Error(`Relevant atom ${a} is not in given support`);
        else atomsToAdd.add(a);
      });
    }
    return count * 2 ** (atomsToAdd.size);
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
  pickAllSolutions(bddNode: BDDNode, atoms?: string[]): Valuation[] {
    return this.pickSolutions(bddNode, Infinity, atoms);
  }
  /**
   * NB: this is not efficient at all
   */
  pickSolutions(bddNode: BDDNode, max: number = 10, atoms?: string[]): Valuation[] {
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
    return getSetOfTrueAtomsOf(bddNode, max, atoms).map(trueAtoms => new Valuation(trueAtoms));
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
  createCube(assignment: Map<string, boolean>): BDDNode {
    const literals = []
    for (const [atom, value] of Array.from(assignment.entries())) {
      let lit = this.createLiteral(atom);
      if (!value) lit = this.applyNot(lit);
      literals.push(lit);
    }
    return this.applyAnd(literals);
  }

  toValuation(bddNode: BDDNode, atoms?: string[]): Valuation {
    const sols = this.pickSolutions(bddNode, 2, atoms);
    if (sols.length === 0) throw new Error("FALSE is not a valuation");
    if (sols.length === 1) return sols[0];
    if (sols.length === 2) throw new Error("Too many solutions: this is not a valuation");
    throw new Error("Too many solutions: this is a bug in pickSolutions()!");
  }

  destroy(bddNode: BDDNode): void {
    this.bddModule._destroy(bddNode);
  }

  createCopy(bddNode: BDDNode): BDDNode {
    return this.bddModule._create_copy(bddNode)
  }

  stackTrace() {
    return this.bddModule.stackTrace();
  }



}



