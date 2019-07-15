import { BDDNode } from './../modules/core/models/epistemicmodel/bddnode'
import { Formula, TrueFormula } from './../modules/core/models/formula/formula';



export class BDDServiceWorkerService {
  static i = 0;
  static promises = [];

  private static worker = BDDServiceWorkerService.createWorker();

  static createWorker()  {
    let worker = new Worker('../modules/core/services/bddworker.worker.ts', { type: 'module' });
    console.log("creating BDDServiceWorkerService");
    console.log("Worker created");
    /** function called when the worker has computed the result of sth */
    worker.onmessage = (msg) => {
      const {id, err, result} = msg.data
      console.log("data received from the worker: ");
      console.log(msg.data.result.toString());
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

    return worker;

  }

  public static formulaToBDD(formula: Formula) {
    return BDDServiceWorkerService.call("formulaStringToBDD", [formula.prettyPrint()]);
  }

  public static applyAnd(args: BDDNode[]) : Promise<BDDNode>{
    return BDDServiceWorkerService.call("applyAnd", args);
  }

  
  public static createTrue() : Promise<BDDNode>{
    return this.formulaToBDD(new TrueFormula());
  }

  public static createCopy(bdd: BDDNode) : Promise<BDDNode>{
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
  
  public static countSolutions(b: BDDNode, atoms: string[]) {
    console.log(atoms)
    return BDDServiceWorkerService.call("countSolutions", [b, atoms]);
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

  public static applyOr(bdds: any[]) {
    return BDDServiceWorkerService.call("applyOr", [bdds]);
  }

  public static applyEquiv(b1, b2: BDDNode) {
    return BDDServiceWorkerService.call("applyEquiv", [b1, b2]);
  }

  public static applyNot(formula: number) : Promise<BDDNode> {
    return BDDServiceWorkerService.call("applyNot", [formula])
  }

  public static createFalse() : Promise<BDDNode> {
    let voidArgs: any[] = [1,2];
    return BDDServiceWorkerService.call("createFalse", voidArgs);
  }

  public static createLiteral(a: string) : Promise<BDDNode> {
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
