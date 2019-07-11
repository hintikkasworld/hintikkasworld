import { BDDNode } from './../modules/core/models/epistemicmodel/bddnode'
import { Formula } from './../modules/core/models/formula/formula';

export class BDDServiceWorkerService {
  i = 0;
  promises = [];

  private worker;

  constructor() { 
    this.worker = new Worker('../modules/core/services/bddworker.worker.ts', { type: 'module' });

    /** function called when the worker has computed the result of sth */
    this.worker.onmessage = (msg) => {
      const {id, err, result} = msg.data
    
      if (result) {
        const resolve = this.promises[id].resolve
        if (resolve) {
          resolve(result)
        }
      } else {
        // error condition
        const reject = this.promises[id].reject
        if (reject) {
            if (err) {
              reject(err)
            } else {
              reject('Got nothing')
            }
        }
      }
      
      // purge used callbacks
      delete this.promises[id].resolve
      delete this.promises[id].reject
    }

  }

  public formulaToBDD(formulaString: string): Promise<BDDNode> {
    return new Promise((resolve, reject) => {

      var id = this.i++;
      this.promises[id] = {resolve: resolve, reject: reject};

      //we send formula to the worker
      //id = id of the task
      this.worker.postMessage({id: id, formula: formulaString});
    });
  }
}
