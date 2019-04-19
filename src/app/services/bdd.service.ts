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

  isTrue(b: BDDNode): boolean {
    return this.bddModule._is_true(b);
  }

  isFalse(b: BDDNode): boolean {
    return this.bddModule._is_false(b);
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
    let result = this.createTrue();
    for (let i = 0; i < b.length; i++) {
      result = this.bddModule._apply_and(result, b[i]);
    }
    return result;
  }

  applyOr(b: BDDNode[]): BDDNode {
    let result = this.createFalse();
    for (let i = 0; i < b.length; i++) {
      result = this.bddModule._apply_or(result, b[i]);
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
    return this.bddModule._apply_conditioning(b, cube);
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

  //   save(b: BDDNode): void {
  //     this.bddModule._save();
  //   }

  pickRandomSolution(bddNode: BDDNode): Valuation {
    throw new Error("DEPRECATED: use pickOneSolution()");
  }

  pickOneSolution(bddNode: BDDNode): Valuation {
    const sols = this.pickSolutions(bddNode, 1);
    if (sols.length === 0) throw new Error("No solution to pick!");
    if (sols.length !== 1) throw new Error("Too many solutions: this is a bug in pickSolutions()!");
    return sols[0];
  }

  /**
   * NB: this is not efficient
   */
  pickSolutions(bddNode: BDDNode, max?: number): Valuation[] {
    const getSetOfTrueAtomsOf = (n: BDDNode, max: number): string[][] => {
      if (max === 0 || this.isFalse(n)) return [];
      if (this.isTrue(n)) return [[]];
      const sols = getSetOfTrueAtomsOf(this.getElseOf(n), max);
      if (sols.length === max) return sols;
      if (max !== undefined) max = max - sols.length;
      let thenSols = getSetOfTrueAtomsOf(this.getThenOf(n), max);
      for (let trueAtoms of thenSols) {
        trueAtoms = trueAtoms.slice();
        trueAtoms.push(this.getAtomOf(n));
        sols.push(trueAtoms);
      }
      return sols;
    };
    return getSetOfTrueAtomsOf(bddNode, max).map(trueAtoms => new Valuation(trueAtoms));
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

  createCube(assignment: Map<string, boolean>): BDDNode {
    const literals = []
    for (const [atom, value] of Array.from(assignment.entries())) {
      let lit = this.createLiteral(atom);
      if (!value) lit = this.applyNot(lit);
      literals.push(lit);
    }
    return this.applyAnd(literals);
  }

  toValuation(bddNode: BDDNode): Valuation {
    const sols = this.pickSolutions(bddNode, 2);
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



