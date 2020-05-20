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

    return bddService[functionName].apply(bddService, args);
}

addEventListener('message', ({ data }) => {
    const response = {
        id: data.id,
        result: executeFunctionByName(data.functionName, data.args)
    };

    postMessage(response);
});
