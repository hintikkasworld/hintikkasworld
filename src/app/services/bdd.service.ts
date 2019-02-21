import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { isPlatformWorkerUi } from '@angular/common';

//import * as Module from "./../../wasm/fibonacci.js";  <=== là on importe le JS d'Alexandre
//import "!!file-loader?name=wasm/fibonacci.wasm!../../wasm/fibonacci.wasm";  // <==== là où on important le WASM d'Alexandre

@Injectable({
  providedIn: 'root'
})

type BDDNode = number;

export class BddService {
  bddModule: any;

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


  isTrue(b: BDDNode): boolean {
    return this.bddModule._is_true(b);
  }

  isFalse(b: BDDNode): boolean {
    return this.bddModule._is_false(b);
  }

  


}
