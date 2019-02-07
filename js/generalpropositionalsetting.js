'use strict';

/**
 *@class Valuation
 @description A valuation that is, a est of atomic propositions.
 * @param truePropositions an array of true propositions, or an object e.g. {p: false, q: true}
 * @returns a valuation where all propositions in truePropositions are true and others are false, or that represents that object
   @example new Valuation(["p", "r"])
 */
class Valuation
{
    constructor(truePropositions) {
      if(!(truePropositions  instanceof Array))
          this.propositions = truePropositions;
      else {
        this.propositions = {};

        if(truePropositions != undefined)
           for(var i in truePropositions)
  	            this.propositions[truePropositions[i]] = true;
      }
    }





    modelCheck(p)
    {
    	return (this.propositions[p] == true)
    }


    toString()
    {
      /*let s = "";

      let putcomma = false;

      	for(let i in this.propositions) {
      	   if(this.propositions[i] == true) {
      	      if(putcomma)
      		         s += ",";
          		if(!putcomma)
          		  putcomma = true;
      		s += i;
	       }
	      }


	       return s;*/
      
        let truePropositions = new Array();
        
        for(let i in this.propositions)
            if(this.propositions[i] == true)
                truePropositions.push(i);
            
        truePropositions.sort();
        
        return truePropositions.join();
      
    }
}








  /**
  @class A postcondition that transforms a valuation by a set of assignments
* @description the postcondition object corresponding to assignments given in post
  * @param: post is an associative array where entries are (proposition formula)
     Formula could be already parsed formula or string that represents the formula.
  * @example new PropositionalAssignmentsPostcondition([p: createFormula("(K a p)"), "q": "top"])
  * */
class PropositionalAssignmentsPostcondition
{
  constructor(post)
  {
    this.post = post;

    for(let p in post) {
      if(typeof(post[p]) == "string")
           post[p] = createFormula(post[p]);
    }
  }

  /**
  @param M an epistemic modelCheck
  @param w an id of a possible world
  @returns a world object that is the update of the world of id w by the postcondition
  */
  perform(M, w)
  {
      var newWorld = clone(M.nodes[w]);
    	for(let p in this.post)
      	 newWorld.propositions[p] = M.modelCheck(w, this.post[p]);

    	return newWorld;
  }
  
  
  
  
  
  
  toString() {
      let s = "";
      for(let p in this.post)
          s += p + ":=" + this.post[p] + " ";
      return s;
  }
}
