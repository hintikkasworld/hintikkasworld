import { BehaviorSubject } from 'rxjs';
import { ExplicitSuccessorSet } from './explicit-successor-set';
import * as types from './../formula/formula';
import { Graph } from '../graph';
import { EpistemicModel } from './epistemic-model';
import { environment } from 'src/environments/environment';
import { World } from './world';
import { SuccessorSet } from './successor-set';

export class ExplicitEpistemicModel extends Graph implements EpistemicModel {
    nodeToID: Map<World, string> = new Map();

    isLoadedObservable(): BehaviorSubject<boolean> {
        return new BehaviorSubject<boolean>(true);
    }

    isLoaded(): boolean {
        return true;
    }

    async check(formula: types.Formula) {
        return this.modelCheck(this.getPointedWorldID(), formula);
    }

    getSuccessors(w: World, a: string): SuccessorSet {
        let successorIDs = this.getSuccessorsID(this.nodeToID.get(w), a);
        console.log(a + '-successors of ' + this.nodeToID.get(w) + ': ' + successorIDs);
        return new ExplicitSuccessorSet(successorIDs.map((id) => this.getNode(id)));
    }

    /**
     @param w ID of a node
     @example M.setPointedWorld("w")
     **/
    setPointedWorld(w: string) {
        if (this.nodes[w] == undefined) {
            throw new Error('the epistemic model does not contain any world of ID ' + w);
        }
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
        console.log('world of id ' + w + ' is added');
        if (this.nodeToID.has(content)) {
            throw new Error('oups, this world has already been added!');
        }
        this.nodeToID.set(content, w);
        console.log('nodeToID contains ' + this.nodeToID.size + ' elements');
    }

    /**
     @returns a string that represents the list of node IDs
     */
    getWorldsPrettyPrint() {
        let s = '';

        for (let w in this.getNodes()) {
            s += w + ', ';
        }

        s += '...';

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
            throw new Error('No worlds named ' + w + '. Worlds of the epistemic model are ' + this.getWorldsPrettyPrint());
        }

        switch (true) {
            case phi instanceof types.TrueFormula:
                return true;
            case phi instanceof types.AtomicFormula:
                return (this.nodes[w] as World).modelCheck((phi as types.AtomicFormula).getAtomicString());
            case phi instanceof types.FalseFormula:
                return false;
            case phi instanceof types.ImplyFormula:
                return (
                    !this.modelCheck(w, (phi as types.ImplyFormula).formula1) || this.modelCheck(w, (phi as types.ImplyFormula).formula2)
                );
            case phi instanceof types.EquivFormula:
                return this.modelCheck(w, (phi as types.EquivFormula).formula1) == this.modelCheck(w, (phi as types.EquivFormula).formula2);
            case phi instanceof types.AndFormula:
                return (phi as types.AndFormula).formulas.every((f) => this.modelCheck(w, f));
            case phi instanceof types.OrFormula:
                return (phi as types.OrFormula).formulas.some((f) => this.modelCheck(w, f));
            case phi instanceof types.XorFormula: {
                let c = 0;
                for (let f of (phi as types.XorFormula).formulas) {
                    if (this.modelCheck(w, f)) {
                        c++;
                    }

                    if (c > 1) {
                        return false;
                    }
                }
                return c == 1;
            }
            case phi instanceof types.NotFormula:
                return !this.modelCheck(w, (phi as types.NotFormula).formula);
            case phi instanceof types.KFormula: {
                let phi2 = phi as types.KFormula;
                let agent = phi2.agent;
                let psi = phi2.formula;
                return this.getSuccessorsID(w, agent).every((u) => this.modelCheck(u, psi));
            }
            case phi instanceof types.KposFormula: {
                let phi2 = phi as types.KposFormula;
                let agent = phi2.agent;
                let psi = phi2.formula;
                return this.getSuccessorsID(w, agent).some((u) => this.modelCheck(u, psi));
            }
            case phi instanceof types.KwFormula: {
                let phi2 = phi as types.KwFormula;
                let agent = phi2.agent;
                let psi = phi2.formula;
                if (this.getSuccessorsID(w, agent).every((u) => this.modelCheck(u, psi))) {
                    return true;
                } else if (this.getSuccessorsID(w, agent).every((u) => !this.modelCheck(u, psi))) {
                    return true;
                } else {
                    return false;
                }
            }
            case phi instanceof types.ExactlyFormula: {
                let c = 0;
                for (let s of (phi as types.ExactlyFormula).variables) {
                    if ((this.nodes[w] as World).modelCheck(s)) {
                        c += 1;
                    }
                }
                return c == (phi as types.ExactlyFormula).count;
            }
        }
    }

    /**
     @return a new epistemic model that is the bisimilar contraction of the
     current one
     @example let Mcontracted = M.contract();
     **/
    contract() {
        function getClassNumberToWorldName(i: number) {
            return 'w' + i;
        }

        function getSameValuationDictionnary(M: ExplicitEpistemicModel): { [id: string]: string[] } {
            // regroupe par valuation identiques => val est un dict (valuation, [idnode1,idnode2,..])
            let val: { [id: string]: string[] } = {};

            for (let idnode in M.nodes) {
                let valuation = M.nodes[idnode].toString();

                if (valuation in val) {
                    val[valuation].push(idnode);
                } else {
                    val[valuation] = [idnode];
                }
            }
            return val;
        }

        function getPiFromValuation(val: { [val: string]: string[] }): { pi: { [val: string]: number[] }; nb: number } {
            // crée l'objet pi qui à un idnode associe un groupe.
            let pi = {}; // dictionnary containing (idnode,group)
            let groupe = 1;
            for (let valuation in val) {
                for (let node of val[valuation]) {
                    pi[node] = groupe;
                }
                groupe = groupe + 1;
            }
            return { pi, nb: groupe - 1 };
        }

        function raffine(pi: { [val: string]: number[] }, model: ExplicitEpistemicModel, nbgroupes) {
            function constructSignature(pi: { [val: string]: number[] }, model: ExplicitEpistemicModel): { [w: string]: number[][] } {
                /**
                 * Supress duplication
                 */
                function cleanArray(array: number[]): number[] {
                    let i: number,
                        j: number,
                        len: number = array.length,
                        out = [],
                        obj: { [x: number]: {} } = {};
                    for (i = 0; i < len; i++) {
                        obj[array[i]] = {};
                    }
                    for (let j in obj) {
                        out.push(j);
                    }
                    return out;
                }

                let signature: { [w: string]: number[][] } = {};
                for (let w in pi) {
                    let sig = [];
                    sig.push(pi[w]);

                    for (let agent of model.getAgents()) {
                        let sig2: number[] = [];
                        let successors = model.getSuccessorsID(w, agent);
                        if (!(successors == undefined)) {
                            for (let s of successors) {
                                sig2.concat(pi[s]);
                            }
                        }
                        sig2 = cleanArray(sig2);
                        sig.push(sig2.sort());
                    }
                    signature[w] = sig;
                }
                return signature;
            }

            function getStatesSortedAccordingToSignature(
                pi: { [val: string]: number[] },
                signature: { [w: string]: number[][] }
            ): string[] {
                let sigma = Object.keys(pi);

                sigma.sort(function (w, u) {
                    if (signature[w] < signature[u]) {
                        return -1;
                    }
                    if (signature[w] > signature[u]) {
                        return 1;
                    }
                });

                return sigma;
            }

            function renameStates(sigma: string[], signature: { [w: string]: number[][] }) {
                let pi2 = {}; // result
                let num = 1;
                pi2[sigma[0]] = num;
                for (let i = 1; i < sigma.length; i++) {
                    if (signature[sigma[i]][0] != signature[sigma[i - 1]][0]) {
                        num = num + 1;
                    } else {
                        let diff = false;
                        let j = 1;
                        while (!diff && j < model.getAgents().length) {
                            if (signature[sigma[i]][j].length != signature[sigma[i - 1]][j].length) {
                                num = num + 1;
                                diff = true;
                            } else {
                                for (let k = 0; k < signature[sigma[i]][j].length; k++) {
                                    if (signature[sigma[i]][j][k] != signature[sigma[i - 1]][j][k]) {
                                        diff = true;
                                    }
                                }
                                if (diff) {
                                    num = num + 1;
                                }
                                j = j + 1;
                            }
                        }
                    }

                    pi2[sigma[i]] = num;
                }

                return { pi2, nb2: num };
            }

            let signature = constructSignature(pi, model);

            let sigma = getStatesSortedAccordingToSignature(pi, signature);

            let pi2nb2 = renameStates(sigma, signature);

            if (pi2nb2.nb2 == nbgroupes) {
                // End of raffinement
                return pi2nb2.pi2;
            } else {
                // while changes
                return raffine(pi2nb2.pi2, model, pi2nb2.nb2);
            }
        }

        function writeContractedVersionAfterRaffinement(piraffined, M: ExplicitEpistemicModel) {
            let contracted = new ExplicitEpistemicModel();

            let pireversed = [];
            for (let w in piraffined) {
                if (piraffined[w] in pireversed) {
                    pireversed[piraffined[w]].push(w);
                } else {
                    pireversed[piraffined[w]] = [w];
                }
            }
            for (let i = 1; i < pireversed.length; i++) {
                // boucle de création des mondes et du pointage
                contracted.addWorld(getClassNumberToWorldName(i), M.nodes[pireversed[i][0]] as World); // crée le monde
                if (pireversed[i].includes(M.getPointedWorldID())) {
                    contracted.setPointedWorld(getClassNumberToWorldName(i)); // ajoute le pointage
                }
            }

            for (let i = 1; i < pireversed.length; i++) {
                // boucle de créations des arrêtes
                for (let ag of M.getAgents()) {
                    if (M.getSuccessorsID(pireversed[i][0], ag) !== undefined) {
                        let successors = M.getSuccessorsID(pireversed[i][0], ag);
                        for (let s of successors) {
                            contracted.addEdge(ag, getClassNumberToWorldName(i), getClassNumberToWorldName(piraffined[s]));
                        }
                    }
                }
            }
            if (contracted.getPointedWorldID() == undefined) {
                throw new Error('the contracted model has no pointed world! aïe!');
            }

            return contracted; // Retourne un graphe réduit.
        }

        let val = getSameValuationDictionnary(this);
        let pinb = getPiFromValuation(val);
        let piraffined = raffine(pinb.pi, this, pinb.nb);
        return writeContractedVersionAfterRaffinement(piraffined, this);
    }

    getPointedWorld(): World {
        return this.getNode(this.getPointedWorldID()) as World;
    }
}
