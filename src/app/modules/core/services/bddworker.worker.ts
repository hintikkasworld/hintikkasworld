
import { Formula } from './../models/epistemicmodel/formula';
import { BddService } from './../../../services/bdd.service';
import { BDDNode } from './../../core/models/epistemicmodel/bddnode'

/// <reference lib="webworker" />

/**
 * BDDService contains a service to deal with Binary Decision Diagrams in a synchronous way.
 */
let bddService = new BddService( () => {});



function executeFunctionByName(functionName, args) {
    if(bddService[functionName] == undefined)
      throw functionName + " is not a member of bddService";

    console.log("we apply " + functionName + " on " + args);
    return bddService[functionName].apply(bddService, args);
}



addEventListener('message', ({ data }) => {
  console.log("data received by the worker: " + data);  
  const response = {
      id: data.id,
      result: executeFunctionByName(data.functionName, data.args)
  }
        
  console.log("data sent back by the worker: " + response);
  postMessage(response);
});
