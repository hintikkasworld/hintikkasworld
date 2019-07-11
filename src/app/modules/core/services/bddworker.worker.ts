
import { Formula } from './../models/epistemicmodel/formula';
import { BddService } from './../../../services/bdd.service';
import { BDDNode } from './../../core/models/epistemicmodel/bddnode'

/// <reference lib="webworker" />

let bddService = new BddService( () => {});



function executeFunctionByName(functionName, args) {
    return bddService[functionName].apply(bddService, args);
}



addEventListener('message', ({ data }) => {
  console.log("data received by the worker: " + data);  
  const response = {
      id: data.id,
      result: executeFunctionByName(data.functionName, data.args)
  }
        

  postMessage(response);
});
