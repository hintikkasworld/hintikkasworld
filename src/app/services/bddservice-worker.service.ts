import { BDDNode } from './../modules/core/models/epistemicmodel/bddnode'
import { Formula } from './../modules/core/models/formula/formula';
import { Valuation } from '../modules/core/models/epistemicmodel/valuation';

export class BDDServiceWorkerService {
  static i = 0;
  static promises = [];

  private static worker = new Worker('../modules/core/services/bddworker.worker.ts', { type: 'module' });;

  constructor() {
    console.log("creating BDDServiceWorkerService");
    console.log("Worker created");
    /** function called when the worker has computed the result of sth */
    BDDServiceWorkerService.worker.onmessage = (msg) => {
      const {id, err, result} = msg.data
    
      if (result) {
        console.log("the worker answered : " + result);
        const resolve = BDDServiceWorkerService.promises[id].resolve
        if (resolve) {
          resolve(result)
        }
      } else {
        // error condition
        const reject = BDDServiceWorkerService.promises[id].reject
        if (reject) {
            if (err) {
              reject(err)
            } else {
              reject('Got nothing')
            }
        }
      }
      
      // purge used callbacks
      delete BDDServiceWorkerService.promises[id].resolve
      delete BDDServiceWorkerService.promises[id].reject
    }

  }

  public static formulaToBDD(formula: Formula) {
    return BDDServiceWorkerService.call("formulaToBDD", [formula.prettyPrint()]);
  }

  public static applyAnd(args: BDDNode[]) {
    return BDDServiceWorkerService.call("applyAnd", args);
  }

  
  public static createCopy(bdd: BDDNode) {
    return BDDServiceWorkerService.call("createCopy", [bdd]);
  }


  public static createCube(trueProps: string[], falseProps: string[]){
    return BDDServiceWorkerService.call("createCube", [trueProps, falseProps]);
  }


  public static applyExistentialForget(b: BDDNode, atoms: string[]) {
    return BDDServiceWorkerService.call("applyExistentialForget", [b, atoms]);
  }


  public static applyRenaming(b: BDDNode, renaming: Map<string, string>) {
    return BDDServiceWorkerService.call("applyRenaming", [b, renaming]);
  }

  public static pickAllSolutions(b: BDDNode, atoms: string[]) {
    return BDDServiceWorkerService.call("pickAllSolutions", [b, atoms]);
  }
  
  public static pickRandomSolution(b: BDDNode, atoms: string[]) {
    return BDDServiceWorkerService.call("pickRandomSolution", [b, atoms]);
  }

  public static applyConditioning(b: BDDNode, valuationToMap: Map<string, boolean>) {
    return BDDServiceWorkerService.call("applyConditioning", [b, valuationToMap]);
  }

  public static isConsistent(b: BDDNode) {
    return BDDServiceWorkerService.call("isConsistent", [b]);
  }

  public static applyOr(model: any[]) {
    return BDDServiceWorkerService.call("applyOr", model);
  }

  public static createFalse() {
    let voidArgs: any[] = [1,2];
    return BDDServiceWorkerService.call("createFalse", voidArgs);
  }

  public static createLiteral(a: string) {
    return BDDServiceWorkerService.call("createLiteral", [a]);
  }

  /**
   * 
   * @param functionName 
   * @param args 
   * @description call the method functionName of BDDService on the webworker side with the arguments args
   */
  public static call(functionName: String, args: any[]): Promise<any>{
    return new Promise((resolve, reject) => {

      let id = BDDServiceWorkerService.i++;
      BDDServiceWorkerService.promises[id] = {resolve: resolve, reject: reject};

      //we send formula to the worker
      //id = id of the task
      BDDServiceWorkerService.worker.postMessage({id: id, functionName: functionName, args: args});
    });
  }
}
