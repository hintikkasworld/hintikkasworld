import { BDDNode } from './../modules/core/models/epistemicmodel/bddnode'
import { Formula } from './../modules/core/models/formula/formula';

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

  public formulaToBDD(formula: Formula): Promise<BDDNode> {
    return new Promise((resolve, reject) => {

      let id = BDDServiceWorkerService.i++;
      BDDServiceWorkerService.promises[id] = {resolve: resolve, reject: reject};

      //we send formula to the worker
      //id = id of the task
      BDDServiceWorkerService.worker.postMessage({id: id, formula: formula.prettyPrint()});
    });
  }
}
