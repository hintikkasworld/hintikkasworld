import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { isPlatformWorkerUi } from '@angular/common';
import { Valuation } from '../modules/core/models/epistemicmodel/valuation';

//import * as Module from "./../../wasm/fibonacci.js";  <=== là on importe le JS d'Alexandre
//import "!!file-loader?name=wasm/fibonacci.wasm!../../wasm/fibonacci.wasm";  // <==== là où on important le WASM d'Alexandre

/**
@Injectable({
  providedIn: 'root'
})
 */

 export type BDDNode = number;

export class BddService {
  bddModule: any;

  atomIndex: Map<string, number> = new Map();
  indexAtom: Map<number, string> = new Map();
  newIndexForAtoms: number;

  wasmReady = new BehaviorSubject<boolean>(false);


  constructor() {
    // this.instantiateWasm("wasm/fibonacci.wasm"); <=============on load ici
  }



  private async instantiateWasm(url: string) {
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
        this.wasmReady.next(true);
      }
    };

    // instantiate the module
    // this.module = BDDModule(moduleArgs); <==== là on instancie

  }


  private getIndexFromAtom(p: string) {
    if (!this.atomIndex.has(p)) {
      this.atomIndex.set(p, this.newIndexForAtoms);
      this.indexAtom.set(this.newIndexForAtoms, p);
      this.newIndexForAtoms++;
    }
    return this.atomIndex.get(p);
  }

  private getAtomFromIndex(i: number): string {
    return this.indexAtom.get(i);
  }

  isTrue(b: BDDNode): boolean {
    return this.bddModule._is_true(b);
  }

  isFalse(b: BDDNode): boolean {
    return this.bddModule._is_false(b);
  }

  createTrue(): BDDNode {
    return this.bddModule._create_true();
  }

  createFalse(): BDDNode {
    return this.bddModule._create_false();
  }

  createAnd(b: BDDNode[]): BDDNode {
    if (b.length == 0)
      return this.createTrue();
    else {
      let result = b[0];
      for (let i = 1; i < b.length; i++) {
        result = this.bddModule.create_and(result, b[i]);
      }
      return result;
    }
  }

  createOr(b: BDDNode[]): BDDNode {
    if (b.length == 0)
      return this.createTrue();
    else {
      let result = b[0];
      for (let i = 1; i < b.length; i++) {
        result = this.bddModule.create_or(result, b[i]);
      }
      return result;
    }
  }

  createNot(b: BDDNode): BDDNode {
    return this.bddModule._create_not(b);
  }

  createImply(b1: BDDNode, b2: BDDNode): BDDNode {
    return this.bddModule._create_imply(b1, b2);
  }

  createEquiv(b1: BDDNode, b2: BDDNode): BDDNode {
    return this.bddModule._create_equiv(b1, b2);
  }

  createAtom(p: string): BDDNode {
    let i = this.getIndexFromAtom(p);
    return this.bddModule._create_atom(i);
  }

  createIte(p: string, bThen: BDDNode, bElse: BDDNode): BDDNode {
    return this.bddModule._create_ite(this.getIndexFromAtom(p), bThen, bElse);
  }

  createExistentialForget(b: BDDNode, props: string[]): BDDNode {
    throw new Error("to be implemented");
  }

  createUniversalForget(b: BDDNode, props: string[]): BDDNode {
    throw new Error("to be implemented");
  }

  createConditioning(b: BDDNode, v: Valuation) {
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

  save(b: BDDNode): void {
    this.bddModule._save();
  }
}



