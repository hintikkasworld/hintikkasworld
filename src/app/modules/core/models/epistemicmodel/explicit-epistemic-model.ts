import { BehaviorSubject } from 'rxjs';
import { ExplicitSuccessorSet } from './explicit-successor-set';
import * as types from './../formula/formula';
import { Graph } from './../graph';
import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { environment } from 'src/environments/environment';
import { World } from './world';
import { SuccessorSet } from './successor-set';

export class ExplicitEpistemicModel extends Graph implements EpistemicModel {
    isLoadedObservable(): BehaviorSubject<boolean> {
        let isLoaded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
        return isLoaded$;
    }
    isLoaded(): boolean {
        return true;
    }


    async check(formula: types.Formula) {
        return await this.modelCheck(this.getPointedWorldID(), formula);
    }

    nodeToID: Map<World, string> = new Map();


    getSuccessors(w: World, a: string): SuccessorSet {
        let successorIDs = this.getSuccessorsID(this.nodeToID.get(w), a);
        console.log(a + "-successors of " + this.nodeToID.get(w) + ": " +  successorIDs);
        return new ExplicitSuccessorSet(successorIDs.map((id) => this.getNode(id)));
    }

    /**
    @param w ID of a node
    @example M.setPointedWorld("w")
    **/
    setPointedWorld(w: string) {
        if (this.nodes[w] == undefined)
            throw ("the epistemic model does not contain any world of ID " + w);
        this.setPointedNode(w);
    }


    /**
    @returns the pointed world
    **/
    getPointedWorldID() {
        return this.getPointedNode();
    }

    /**
     * @param w world identifier
     * @param content the content a world. It is an object that should
         implement a method modelCheck for check atomic formulas.
             Typically, it is an object containing a propositional World.
 
             If content is an array, then content is replaced by
             new Valuation(content)
        @example M.addWorld("w", new Valuation(["p", "s"]))
        @example M.addWorld("w", new SallyAndAnneWorld(["ahere", "bhere", "marbleb"]));
     * */
    addWorld(w: string, content: World) {
        this.addNode(w, content);
        console.log("world of id " + w + " is added")
        if(this.nodeToID.has(content))
            throw "oups, this world has already been added!";
        this.nodeToID.set(content, w);
        console.log("nodeToID contains " + this.nodeToID.size + " elements")
    }





    /**
    @returns a string that represents the list of node IDs
    */
    getWorldsPrettyPrint() {
        let s = "";

        for (let w in this.getNodes()) {
            s += w + ", ";
        }

        s += "...";

        return s;

    }

    /**
     * @param w world identifier
     * @param phi a formula (internal representation of a formula)
     * @returns true if formula phi is true in w
     * @example M.modelCheck("w", createFormula("(not p)"))
     * @example M.modelCheck("w", createFormula("(not (K a p))"))
     * */
    modelCheck(w: string, phi: types.Formula): boolean {
        if (this.getNode(w) == undefined) {
            throw ("No worlds named " + w + ". Worlds of the epistemic model are "
                + this.getWorldsPrettyPrint());
        }

        switch (true) {
            case (phi instanceof types.TrueFormula): return true;
            case (phi instanceof types.AtomicFormula): return (<World>this.nodes[w]).modelCheck((<types.AtomicFormula>phi).getAtomicString());
            case (phi instanceof types.FalseFormula): return false;
            case (phi instanceof types.ImplyFormula): return !this.modelCheck(w, (<types.ImplyFormula>phi).formula1) || this.modelCheck(w, (<types.ImplyFormula>phi).formula2);
            case (phi instanceof types.EquivFormula): return this.modelCheck(w, (<types.EquivFormula>phi).formula1) == this.modelCheck(w, (<types.EquivFormula>phi).formula2);
            case (phi instanceof types.AndFormula): return (<types.AndFormula>phi).formulas.every((f) => this.modelCheck(w, f));
            case (phi instanceof types.OrFormula): return (<types.OrFormula>phi).formulas.some((f) => this.modelCheck(w, f));
            case (phi instanceof types.XorFormula): {
                let c = 0;
                for (let f of (<types.XorFormula>phi).formulas) {
                    if (this.modelCheck(w, f))
                        c++;

                    if (c > 1)
                        return false;
                }
                return (c == 1);
            }
            case (phi instanceof types.NotFormula): return !this.modelCheck(w, (<types.NotFormula>phi).formula);
            case (phi instanceof types.KFormula): {
                let phi2 = <types.KFormula>phi;
                let agent = phi2.agent;
                let psi = phi2.formula;
                return this.getSuccessorsID(w, agent)
                    .every(u => this.modelCheck(u, psi));
            }
            case (phi instanceof types.KposFormula):
                {
                    let phi2 = <types.KposFormula>phi;
                    let agent = phi2.agent;
                    let psi = phi2.formula;
                    return this.getSuccessorsID(w, agent)
                        .some(u => this.modelCheck(u, psi));
                }
            case (phi instanceof types.KwFormula): {
                let phi2 = <types.KwFormula>phi;
                let agent = phi2.agent;
                let psi = phi2.formula;
                if (this.getSuccessorsID(w, agent)
                    .every(u => this.modelCheck(u, psi)))
                    return true;
                else if (this.getSuccessorsID(w, agent)
                    .every(u => !this.modelCheck(u, psi))) {
                    return true;
                }
                else return false;
            }
            case (phi instanceof types.ExactlyFormula): {
                let c = 0;
                for (let s of (<types.ExactlyFormula>phi).variables) {
                    if ((<World>this.nodes[w]).modelCheck(s)) {
                        c += 1
                    }
                }
                return (c == (<types.ExactlyFormula>phi).count)
            }
        }
    }






    /**
    @return a new epistemic model that is the bisimilar contraction of the
    current one
    @example let Mcontracted = M.contract();
    **/
    contract() {

        function getClassNumberToWorldName(i) {
            return "w" + i;
        }

        function getSameValuationDictionnary(M) {  //regroupe par valuation identiques => val est un dict (valuation, [idnode1,idnode2,..])
            let val = {};
            for (let idnode in M.nodes) {
                let valuation = M.nodes[idnode].toString();

                if (valuation in val)
                    val[valuation].push(idnode);
                else
                    val[valuation] = [idnode];
            }
            return val;
        }

        function getPiFromValuation(val) {
            //crée l'objet pi qui à un idnode associe un groupe.
            let pi = {};//dictionnary containing (idnode,group)
            var groupe = 1;
            for (let valuation in val) {

                for (let idnode in val[valuation]) {
                    pi[val[valuation][idnode]] = groupe;
                }
                groupe = groupe + 1;
            }
            return { pi: pi, nb: groupe - 1 };
        }



        function raffine(pi, model, nbgroupes) {

            function constructSignature(pi, model) {

                /**
                * Supress duplication
                */
                function cleanArray(array) {
                    var i, j, len = array.length, out = [], obj = {};
                    for (i = 0; i < len; i++) {
                        obj[array[i]] = 0;
                    }
                    for (j in obj) {
                        out.push(j);
                    }
                    return out;
                }

                var signature = {};
                for (let w in pi) {
                    let sig = new Array();
                    sig.push(pi[w]);

                    for (let agent of environment.agents) {
                        let sig2 = new Array();
                        let successors = (model.getSuccessors(w, agent));
                        if (!(successors == undefined)) {
                            for (let s of successors) {
                                sig2.push(pi[s]);
                            }
                        }
                        sig2 = cleanArray(sig2);
                        sig.push(sig2.sort());
                    }
                    signature[w] = sig;
                }
                return signature;
            }

            function getStatesSortedAccordingToSignature(pi, signature) {
                var sigma = Object.keys(pi);

                sigma.sort(function (w, u) {
                    if (signature[w] < signature[u]) return -1;
                    if (signature[w] > signature[u]) return 1;
                });

                return sigma;
            }


            function renameStates(sigma, signature) {
                let pi2 = {}; //result
                var num = 1;
                pi2[sigma[0]] = num;
                for (let i = 1; i < sigma.length; i++) {
                    if (signature[sigma[i]][0] != signature[sigma[i - 1]][0]) {
                        num = num + 1;
                    } else {
                        var diff = false;
                        var j = 1;
                        while (!diff && j < environment.agents.length) {
                            if (signature[sigma[i]][j].length != signature[sigma[i - 1]][j].length) {
                                num = num + 1;
                                diff = true;
                            } else {
                                for (let k = 0; k < signature[sigma[i]][j].length; k++) {
                                    if (signature[sigma[i]][j][k] != signature[sigma[i - 1]][j][k]) {
                                        diff = true;
                                    }
                                }
                                if (diff) num = num + 1;
                                j = j + 1;
                            }
                        }

                    }

                    pi2[sigma[i]] = num;
                }


                return { pi2: pi2, nb2: num };
            }


            let signature = constructSignature(pi, model);

            let sigma = getStatesSortedAccordingToSignature(pi, signature);

            let pi2nb2 = renameStates(sigma, signature);


            if (pi2nb2.nb2 == nbgroupes) {
                //End of raffinement
                return pi2nb2.pi2;
            } else {
                //while changes
                return raffine(pi2nb2.pi2, model, pi2nb2.nb2);
            }
        }




        function writeContractedVersionAfterRaffinement(piraffined, M) {
            let contracted = new ExplicitEpistemicModel();

            let pireversed = new Array();
            for (let w in piraffined) {
                if (piraffined[w] in pireversed) {
                    pireversed[piraffined[w]].push(w);
                } else {
                    pireversed[piraffined[w]] = [w];
                }
            }
            for (let i = 1; i < pireversed.length; i++) { // boucle de création des mondes et du pointage
                contracted.addWorld(getClassNumberToWorldName(i), M.nodes[pireversed[i][0]]);//crée le monde
                if (pireversed[i].includes(M.getPointedWorldID())) {
                    contracted.setPointedWorld(getClassNumberToWorldName(i));		//ajoute le pointage
                }
            }

            for (let i = 1; i < pireversed.length; i++) {//boucle de créations des arrêtes
                for (let ag of environment.agents) {
                    if (M.getSuccessors(pireversed[i][0], ag) !== undefined) {
                        let successors = M.getSuccessors(pireversed[i][0], ag);
                        for (let s of successors) {
                            contracted.addEdge(ag,
                                getClassNumberToWorldName(i),
                                getClassNumberToWorldName(piraffined[s]));

                        }
                    }
                }
            }
            if (contracted.getPointedWorldID() == undefined)
                throw "the contracted model has no pointed world! aïe!";


            return contracted; //Retourne un graphe réduit.
        }


        var val = getSameValuationDictionnary(this);
        var pinb = getPiFromValuation(val);
        var piraffined = raffine(pinb.pi, this, pinb.nb);
        return writeContractedVersionAfterRaffinement(piraffined, this);
    }


    getPointedWorld(): World {
        return <World> this.getNode(this.getPointedWorldID());
    }


}
