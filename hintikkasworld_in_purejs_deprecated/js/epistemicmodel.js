'use strict';
/**
 * Create a new empty epistemic model
 * @class EpistemicModel
   @extends Graph
 */
class EpistemicModel extends Graph
{

	/**
	@param w ID of a node
	@example M.setPointedWorld("w")
	**/
	setPointedWorld(w){
		if(this.nodes[w] == undefined)
			throwError("the epistemic model does not contain any world of ID " + w);
        this.setPointedNode(w);
	}


	/**
	@returns the ID of the pointed world
	**/
	getPointedWorld(){
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
		if(content.constructor.name == "Array")
				content = new GenericWorldValuation(content);

		this.addNode(w, content);
	}





	/**
	@returns a string that represents the list of node IDs
	*/
  getWorldsPrettyPrint()
  {
    let s = "";

    for(let w in this.getNodes()) {
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
	modelCheck(w, phi)
	{
    if(this.getNode(w) == undefined) {
      throwError( "No worlds named " + w + ". Worlds of the epistemic model are "
        + this.getWorldsPrettyPrint());
    }

		if(phi instanceof Array)
		{
		    if(phi[0] == "not")
		      return !this.modelCheck(w, phi[1]);
				else
		    if(phi[1] == "or")	{
							for(let i = 0; i < phi.length; i+=2) {
											if(this.modelCheck(w, phi[i]))
													return true;
							}
							return false;
				}
				else
				if(phi[1] == "xor")	{
					let c = 0;
					for(let i = 0; i < phi.length; i+=2) {
									if(this.modelCheck(w, phi[i]))
											c++;

									if(c > 1)
										return false;
					}
					return (c == 1);
				}
				else
				if(phi[1] == "<->" || phi[1] == "equiv") {
					return this.modelCheck(w, phi[0]) == this.modelCheck(w, phi[2]);
				}
				else if(phi[1] == "->" || phi[1] == "imply") 	{
						return !this.modelCheck(w, phi[0]) || this.modelCheck(w, phi[2]);
				}
				else
                if(phi[1] == "and" || phi[1] == "&") {
					for(var i = 0; i < phi.length; i+=2)	{
									if(!this.modelCheck(w, phi[i]))
											return false;
					}
					return true;
				}
				else if(isFormulaKnowThat(phi)) {
							let agent = getFormulaAgent(phi);
							let psi = getFormulaSubFormula(phi);
							return this.getSuccessors(w, agent)
								.every(u => this.modelCheck(u, psi));
		    }
				else if(isFormulaKnowWhether(phi)) {
							let agent = getFormulaAgent(phi);
							let psi = getFormulaSubFormula(phi);
							if(this.getSuccessors(w, agent)
								.every(u => this.modelCheck(u, psi)))
								return true;
						 else if(this.getSuccessors(w, agent)
							 .every(u => !this.modelCheck(u, psi))) {
						 		return true;
						 }
						 else return false;
				}
				else if(isFormulaKnowPosThat(phi)) {
					let agent = getFormulaAgent(phi);
					let psi = getFormulaSubFormula(phi);

					return this.getSuccessors(w, agent)
							.some(u => this.modelCheck(u, psi));
		    }
		    else
		      return this.nodes[w].modelCheck(phi);
		}
		else if(phi == "top" || phi == "true" || phi == 1)
		  return true;
		else if(phi == "bottom" || phi == "false" || phi == 0)
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
            for(let idnode in M.nodes){
                let valuation = M.nodes[idnode].toString();

                if(valuation in val)
                    val[valuation].push(idnode);
                else
                    val[valuation] = [idnode];
            }
            return val;
        }

        function getPiFromValuation(val){
        //crée l'objet pi qui à un idnode associe un groupe.
        let pi={};//dictionnary containing (idnode,group)
        var groupe=1;
        for(let valuation in val){

            for(let idnode in val[valuation]){
            pi[val[valuation][idnode]]=groupe;
            }
            groupe=groupe+1;
        }
        return {pi:pi, nb:groupe-1};
        }



        function raffine(pi,model,nbgroupes) {

            function constructSignature(pi,model){
                var signature={};
                for(let w in pi){
                let sig = new Array();
                sig.push(pi[w]);

                for(let agent of agents){
                    let sig2 = new Array();
                    let successors=(model.getSuccessors(w,agent));
                    if(!(successors==undefined)){
                        for(let s of successors){
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

            function getStatesSortedAccordingToSignature(pi,signature){
                var sigma =  Object.keys(pi);

                sigma.sort(function(w,u){
                if(signature[w]<signature[u]) return -1;
                if(signature[w]>signature[u]) return 1;
                });

                return sigma;
            }


            function renameStates(sigma, signature){
                let pi2={}; //result
                var num=1;
                pi2[sigma[0]]=num;
                for(let i=1;i<sigma.length;i++){
                if(signature[sigma[i]][0]!=signature[sigma[i-1]][0]){
                    num=num+1;
                }else{
                    var diff=false;
                    var j=1;
                    while(!diff && j<agents.length){
                    if(signature[sigma[i]][j].length != signature[sigma[i-1]][j].length){
                        num=num+1;
                        diff=true;
                    }else{
                        for(let k=0;k<signature[sigma[i]][j].length;k++){
                        if(signature[sigma[i]][j][k] != signature[sigma[i-1]][j][k]){
                            diff=true;
                        }
                        }
                        if(diff) num=num+1;
                        j=j+1;
                    }
                    }

                }

                pi2[sigma[i]]=num;
                }


                return {pi2:pi2,nb2:num};
            }


      let signature = constructSignature(pi,model);

      let sigma = getStatesSortedAccordingToSignature(pi,signature);

      let pi2nb2 = renameStates(sigma, signature);


      if(pi2nb2.nb2==nbgroupes){
        //End of raffinement
        return pi2nb2.pi2;
      }else{
        //while changes
        return raffine(pi2nb2.pi2,model,pi2nb2.nb2);
      }
    }




    function writeContractedVersionAfterRaffinement(piraffined,M){
      let contracted = new EpistemicModel();

        let pireversed =new Array();
        for(let w in piraffined){
          if(piraffined[w] in pireversed){
            pireversed[piraffined[w]].push(w);
          }else{
          pireversed[piraffined[w]]=[w];
          }
        }
        for(let i=1;i<pireversed.length;i++){ // boucle de création des mondes et du pointage
          contracted.addWorld(getClassNumberToWorldName(i),M.nodes[pireversed[i][0]]);//crée le monde
          if(pireversed[i].includes(M.getPointedWorld())){
            contracted.setPointedWorld(getClassNumberToWorldName(i));		//ajoute le pointage
          }
        }

            for(let i=1;i<pireversed.length;i++){//boucle de créations des arrêtes
              for(let ag of agents){
                if(M.getSuccessors(pireversed[i][0],ag) !== undefined){
                  let successors = M.getSuccessors(pireversed[i][0],ag);
                  for(let s of successors){
                    contracted.addEdge(ag,
                                       getClassNumberToWorldName(i),
                                       getClassNumberToWorldName(piraffined[s]));

                  }
                }
              }
            }
						if(contracted.getPointedWorld() == undefined)
							throw "the contracted model has no pointed world! aïe!";


            return contracted; //Retourne un graphe réduit.
    }


  	var val = getSameValuationDictionnary(this);
    var pinb = getPiFromValuation(val);
  	var piraffined=raffine(pinb.pi,this,pinb.nb);
    return writeContractedVersionAfterRaffinement(piraffined,this);
  }





}
