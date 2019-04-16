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


@Injectable({
  providedIn: 'root'
})
 
export class BddService {

  bddModule: any;

  atomIndex: Map<string, BDDAtom> = new Map();
  indexAtom: Map<BDDAtom, string> = new Map();

  wasmReady = new BehaviorSubject<boolean>(false);


  constructor(f: ()=>void) {
    this.instantiateWasm("wasm/cuddjs.wasm2", f);



  }



  private async instantiateWasm(url: string, f:()=>void) {
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
        f();
        this.wasmReady.next(true);
        
      }
    };

    // instantiate the module
    this.bddModule = Module(moduleArgs);

  }


  private makeNewAtom(): BDDAtom {
    return this.bddModule._make_new_atom();
  }

  private getIndexFromAtom(p: string): BDDAtom {
    if (!this.atomIndex.has(p)) {
      let i = this.makeNewAtom();
      this.atomIndex.set(p, i);
      this.indexAtom.set(i, p);
    }
    return this.atomIndex.get(p);
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
    return this.bddModule._create_ite(bIf, bThen, bElse);
  }

  applyExistentialForget(b: BDDNode, atoms: string[]): BDDNode {
    // build a typedarray of bdd atoms
    const data = new Int32Array(atoms.map(a => this.getIndexFromAtom(a)));

    // copy it in the module heap
    const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    const dataPtr = this.bddModule._malloc(nDataBytes);
    const dataHeap = new Uint8Array(this.bddModule.HEAPU8.buffer, dataPtr, nDataBytes);
    dataHeap.set(new Uint8Array(data.buffer));

    return this.bddModule._apply_existential_forget(b, dataHeap.byteOffset, data.length);
    this.bddModule._free(dataHeap.byteOffset);
  }

  applyUniversalForget(b: BDDNode, atoms: string[]): BDDNode {
    throw new Error("to be implemented");
  }

  applyConditioning(b: BDDNode, v: Valuation) {
    throw new Error("to be implemented");
  }

  getVarOf(b: BDDNode): string {
    let i = this.bddModule._get_var_of(b);
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

  pickRandomSolution(bddNode: number): Valuation {
    throw new Error("Method not implemented.");
  }

  support(bddNode: BDDNode): [string] {
    throw new Error("to be implemented");
  }

  cube({id: string, value:boolean}): BDDNode{
    throw new Error("to be implemented");
  }

  let({}, bddNode: BDDNode): BDDNode {
    throw new Error("to be implemented");
  }

  toValuation(bddNode: BDDNode): Valuation{
    throw new Error("to be implemented. MUST HAVE ONE UNIQUE SOLUTION. CAN THROW ERROR ?");
  }
}



