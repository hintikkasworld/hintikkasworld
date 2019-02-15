import { EpistemicModel } from './epistemic-model';
import { Graph } from './graph';
import { WorldValuation } from './world-valuation';
import { Formula, FormulaType } from './formula';
import { environment } from 'src/environments/environment';

export class ExplicitEpistemicModel extends Graph implements EpistemicModel {
    /**
    @param w ID of a node
    @example M.setPointedWorld("w")
    **/
    setPointedWorld(w) {
        if (this.nodes[w] == undefined)
            throw ("the epistemic model does not contain any world of ID " + w);
        this.setPointedNode(w);
    }


    /**
    @returns the ID of the pointed world
    **/
    getPointedWorld() {
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
    addWorld(w, content) {
        if (content.constructor.name == "Array")
            content = new WorldValuation(content);

        this.addNode(w, content);
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
    modelCheck(w, phi: Formula) {
        if (this.getNode(w) == undefined) {
            throw ("No worlds named " + w + ". Worlds of the epistemic model are "
                + this.getWorldsPrettyPrint());
        }

        if (phi.getType() == FormulaType.Not)
            return !this.modelCheck(w, phi.getFormulaSubFormula());
        else if (phi.getType() == FormulaType.Or) {
            for (let f of phi.getFormulaSubFormulas()) {
                if (this.modelCheck(w, f))
                    return true;
            }
            return false;
        }
        else if (phi.getType() == FormulaType.And) {
            for (let f of phi.getFormulaSubFormulas()) {
                if (!this.modelCheck(w, f))
                    return false;
            }
            return true;
        }
        else if (phi.getType() == FormulaType.Xor) {
            let c = 0;
            for (let f of phi.getFormulaSubFormulas()) {
                if (this.modelCheck(w, f))
                    c++;

                if (c > 1)
                    return false;
            }
            return (c == 1);
        }
        else if (phi.getType() == FormulaType.Equiv) {
            return this.modelCheck(w, phi.getSubFormulaFirst()) == this.modelCheck(w, phi.getSubFormulaSecond());
        }
        else if (phi.getType() == FormulaType.Imply) {
            return !this.modelCheck(w, phi.getSubFormulaFirst()) || this.modelCheck(w, phi.getSubFormulaSecond());
        }
        else if (phi.getType() == FormulaType.K) {
            let agent = phi.getAgent();
            let psi = phi.getFormulaSubFormula();
            return this.getSuccessors(w, agent)
                .every(u => this.modelCheck(u, psi));
        }
        else if (phi.getType() == FormulaType.Kw) {
            let agent = phi.getAgent();
            let psi = phi.getFormulaSubFormula();
            if (this.getSuccessors(w, agent)
                .every(u => this.modelCheck(u, psi)))
                return true;
            else if (this.getSuccessors(w, agent)
                .every(u => !this.modelCheck(u, psi))) {
                return true;
            }
            else return false;
        }
        else if (phi.getType() == FormulaType.Kpos) {
            let agent = phi.getAgent();
            let psi = phi.getFormulaSubFormula();

            return this.getSuccessors(w, agent)
                .some(u => this.modelCheck(u, psi));
        }
        else if (phi.getType() == FormulaType.True)
            return true;
        else if (phi.getType() == FormulaType.False)
            return false;
        else
            return this.nodes[w].modelCheck(phi);
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
                if (pireversed[i].includes(M.getPointedWorld())) {
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
            if (contracted.getPointedWorld() == undefined)
                throw "the contracted model has no pointed world! aïe!";


            return contracted; //Retourne un graphe réduit.
        }


        var val = getSameValuationDictionnary(this);
        var pinb = getPiFromValuation(val);
        var piraffined = raffine(pinb.pi, this, pinb.nb);
        return writeContractedVersionAfterRaffinement(piraffined, this);
    }





}
