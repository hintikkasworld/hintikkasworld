import { BddService } from '../../../services/bdd.service';

/// <reference lib="webworker" />

/**
 * BDDService contains a service to deal with Binary Decision Diagrams in a synchronous way.
 */
let bddService = new BddService(() => {});

/**
 *
 * @param functionName
 * @param args
 * @returns the result of the application of the method of name functionName of bddService with the arguments args
 */
function executeFunctionByName(functionName, args) {
    if (bddService[functionName] == undefined) {
        throw new Error(functionName + ' is not a method of bddService');
    }

    // console.log("we apply " + functionName + " on [" + args + "]");
    let result = bddService[functionName].apply(bddService, args);
    //  console.log("the result is: " + result);
    return result;
}

addEventListener('message', ({ data }) => {
    //  console.log("data received by the worker: " + data);
    const response = {
        id: data.id,
        result: executeFunctionByName(data.functionName, data.args),
    };

    // console.log("data sent back by the worker: " + response);
    postMessage(response);
});
