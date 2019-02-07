	'use strict';
/**
 * @param truePropositions an array of true propositions
 * @returns a possible combination of cards
 * @example new CluedoWorld(["aWhite","bKnife","cLibrary","Hall","Pink","Gun"])
 * */

class CluedoWorld extends WorldValuation{
  constructor(propositions) {
      super(propositions);
      
      this.agentPos["a"] = {x: 22, y: 16, r: 16};
        this.agentPos["b"] = {x: 22+50, y: 16, r: 16};
        this.agentPos["c"] = {x: 100+16, y: 16, r: 16};
  	 
	


  }

  draw(context)  {
	
    	 
      let yCards = 48;
      this.drawAgents(context);
      context.font="12px Verdana";
      context.strokeStyle="#000000";


	var items = ["Library", "Hall", "Knife", "Gun", "Pink", "white"	];
      
          
            for(let k=0;k<=items.length;k++){
              if(this.modelCheck("a" + items[k])) {
                drawCard(context, this.agentPos["a"].x-5, yCards, items[k]);
           
              }

              if(this.modelCheck("b" + items[k])) {
                drawCard(context, this.agentPos["b"].x-5, yCards, items[k]);
            
              }
	     if(this.modelCheck("c" + items[k])) {
		drawCard(context, this.agentPos["c"].x-3, yCards, items[k]);
                

             }
          }

         
     

                 }
 }
	



function setExampleCluedo()
{

	var c1,c2,c3;
	function getExampleCluedo(){
	
	
	let M = new EpistemicModel();
	
	var location = ["Library", "Hall"];
	var weapon = ["Knife", "Gun"];
	var colour = ["Pink", "white"];
	
	
	function cleanArray(array) {
  	var i, j, out = [], obj = {};
  	for (i = 0; i < array.length; i++) {
   	 obj[array[i]] = 0;
  	}
  	for (j in obj) {
   	 out.push(j);
  	}
  	return out;
}
	
	

	var items = location.concat(weapon, colour);
	
	for (let il = 0; il<location.length;il++){
      			items.splice(items.indexOf(location[il]),1) 
			
			for(let iw = 0;iw<weapon.length;iw++){
				items.splice(items.indexOf(weapon[iw]),1)

					for(let ic = 0; ic<colour.length;ic++){
						items.splice(items.indexOf(colour[ic]),1)
	
	
	var deck = cleanArray(items);
	
	M.addWorld("w"+colour[ic]+weapon[iw]+location[il],new CluedoWorld(["a"+colour[ic],"b"+weapon[iw],"c"+location[il],deck[0],deck[1],deck[2]]));
	M.addWorld("w"+weapon[iw]+colour[ic]+location[il],new CluedoWorld(["a"+weapon[iw],"b"+colour[ic],"c"+location[il],deck[0],deck[1],deck[2]]));
	M.addWorld("w"+weapon[iw]+location[il]+colour[ic],new CluedoWorld(["a"+weapon[iw],"b"+location[il],"c"+colour[ic],deck[0],deck[1],deck[2]]));
	M.addWorld("w"+location[il]+weapon[iw]+colour[ic],new CluedoWorld(["a"+location[il],"b"+weapon[iw],"c"+colour[ic],deck[0],deck[1],deck[2]]));
	M.addWorld("w"+location[il]+colour[ic]+weapon[iw],new CluedoWorld(["a"+location[il],"b"+colour[ic],"c"+weapon[iw],deck[0],deck[1],deck[2]]));
	M.addWorld("w"+colour[ic]+location[il]+weapon[iw],new CluedoWorld(["a"+colour[ic],"b"+location[il],"c"+weapon[iw],deck[0],deck[1],deck[2]]));	


	items.push(colour[ic]);
											
	                                                      			}	
		items.push(weapon[iw]);			
							     		
		 				              }			
			items.push(location[il]);
							  
			 			   }
	
	agents.forEach(a => M.addEdgeIf(a,(w1, w2) => ["Library", "Hall", "Knife", "Gun", "Pink", "white"].map((i) => a+i).every( (p) => (w1.modelCheck(p) == w2.modelCheck(p)))));
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////	
 	function getRandomInt(min, max) {
    	return Math.floor(Math.random() * (max - min) ) + min;
	}
	var items = ["Library", "Hall", "Knife", "Gun", "Pink", "white"	];
	
	let anycard = Array.from(items);
	
    	var hands = new Array();
    	for(let i = 0; i <= items.length; i++){
      	hands[i] = anycard[getRandomInt(0,items.length)];
	items.splice(items.indexOf(hands[i]),1) 
      	//les mains des joueurs
      	anycard = Array.from(items);
	
	}
	
	let handa= new Array(colour[getRandomInt(0,colour.length)]);
	let handb= new Array(weapon[getRandomInt(0,weapon.length)]);
	let handc= new Array(location[getRandomInt(0,location.length)]);
	
	M.setPointedWorld("w"+handa[0]+handb[0]+handc[0]);
	
	c1=handa[0];
	
	c2=handb[0];
	
	c3=handc[0];

  	return M;


}
	M =getExampleCluedo();
	
	

addExplanation("This example shows how agents a and b can communicate publicly and privately so that they commonly know their hands, whereas agent c does not know.");

addExplanation("First, B answers the question of agent A about his cards", "showcard");


	  addButtonAction(function() {
                function getActionModelPrivateAnnouncement(agent) {
                  let E = new ActionModel();
		  let assignment = {};
                  let assignment1 = {};
		  let assignment2 = {};
		  let assignment3 = {};
                  
		let showcard = " ((b"+c1+") or (b"+c2+") or (b"+c3+"))";
			
		  M.modelCheck(M.getPointedWorld(), createFormula(showcard));

		 E.addAction("d", formula, new PropositionalAssignmentsPostcondition(assignment));

		  E.addAction("e", "b"+c1+"", new PropositionalAssignmentsPostcondition(assignment1));
			
		  E.addAction("f", "b"+c2+"", new PropositionalAssignmentsPostcondition(assignment2));
			
		  E.addAction("g", "b"+c3+"", new PropositionalAssignmentsPostcondition(assignment3));
			
		  
			E.addEdge("c", "e", "f");
			E.addEdge("c", "e", "g");
			E.addEdge("c", "f", "g");
			
		  
		  E.makeReflexiveRelation("a");
                  E.makeReflexiveRelation("b");
                  E.makeReflexiveRelation("c");
		if (M.modelCheck(M.getPointedWorld(), createFormula("((not b"+c1+") and (not b"+c2+") and (not b"+c3+"))"))) {
			E.setPointedAction("d");
		}
		else {
			if (M.modelCheck(M.getPointedWorld(), createFormula("b"+c1))) {
				E.setPointedAction("e");
			}
			else {
				if (M.modelCheck(M.getPointedWorld(), createFormula("b"+c2))) {
					E.setPointedAction("f");
				}
				else {
					E.setPointedAction("g");
				}
			}
		         
		 }
		          return E;
		        }
               
              let Eb = getActionModelPrivateAnnouncement("b");
             

              M = product(M,Eb);
               

                computeButtonsVisibleOrNot();
                compute();
              }, "Agent b answers Agent's a question about which card is holding and show it to him privately .", "(not announcementDone)");
	



	

}



