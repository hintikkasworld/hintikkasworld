	'use strict';
/**
 * @param truePropositions an array of true propositions
 * @returns a possible combination of cards
 * @example new CluedoWorld(["aWhite","bKnife","cLibrary","Hall","Pink","Gun"])
 * */

class HanabiWorld extends WorldValuation{
  constructor(propositions) {
      super(propositions);
      
      this.agentPos["a"] = {x: 64, y: 16, r: 8};
      this.agentPos["b"] = {x: 128-HanabiWorld.cardWidth-10, y: 32, r: 8};
      this.agentPos["c"] = {x: 64, y: 48, r: 8};
  	  this.agentPos["d"] = {x: 20, y: 32, r: 8};
	
      

  }

  
  drawCard(context, agent, i, cardSuit, cardValue) {
        let x, y, dx, dy;
        if(agent == "a") { x = 64-HanabiWorld.cardNumber/2*HanabiWorld.cardWidth; y = 0; dx = HanabiWorld.cardWidth ; dy = 0; }
        if(agent == "b") { x = 128-HanabiWorld.cardWidth; y = 10; dx = 0; dy = HanabiWorld.cardHeight ; }
        if(agent == "c") { x = 64-HanabiWorld.cardNumber/2*HanabiWorld.cardWidth; y = 56; dx = HanabiWorld.cardWidth ; dy = 0; }
        if(agent == "d") { x = 0; y = 10; dx = 0; dy = HanabiWorld.cardHeight ; }
      
        drawCard(context, {x: x + i*dx, y: y + i*dy, w: HanabiWorld.cardWidth, h: HanabiWorld.cardHeight, fontSize: 5, color: cardSuit, text: cardValue});
      
  }
  
  draw(context)  {
        for(let agent of agents) {
            let i = 0;
                for(let cardSuit of HanabiWorld.cardSuits) 
                for(let cardValue of HanabiWorld.cardValues)
                if(this.modelCheck(agent + cardValue + cardSuit)) {
                    this.drawCard(context, agent, i, cardSuit, cardValue);
                    i++;
                }
        this.drawAgents(context);
  }
  }

}



HanabiWorld.cardSuits = ["green", "blue", "orange", "red"];
HanabiWorld.cardValues = ["1", "2", "3", "4", "5"];
HanabiWorld.cardWidth = 9;
HanabiWorld.cardHeight = 8;
HanabiWorld.cardNumber = 5;

function getHanabiWorldCardNames() {
    let A = [];
        for(let cardSuit of HanabiWorld.cardSuits)
            for(let cardValue of HanabiWorld.cardValues)
               A.push(cardValue + cardSuit);
    return A;
}


function arrayShuffle(rsort) {
 for(var idx = 0; idx < rsort.length; idx++)
 {
    var swpIdx = idx + Math.floor(Math.random() * (rsort.length - idx));
    // now swap elements at idx and swpIdx
    var tmp = rsort[idx];
    rsort[idx] = rsort[swpIdx];
    rsort[swpIdx] = tmp;
 }
 return rsort;
}
 

 
 
 
function beloteArrayToListPropositions(A) {
    let listPropositions = [];
    for(let i = 0; i < HanabiWorld.cardNumber; i++)
        listPropositions.push("a" + A[i]);
    
    for(let i = HanabiWorld.cardNumber; i < 2*HanabiWorld.cardNumber; i++)
        listPropositions.push("b" + A[i]);
    
    for(let i = 2*HanabiWorld.cardNumber; i < 3*HanabiWorld.cardNumber; i++)
        listPropositions.push("c" + A[i]);
    
    for(let i = 3*HanabiWorld.cardNumber; i < 4*HanabiWorld.cardNumber; i++)
        listPropositions.push("d" + A[i]);
    
    return listPropositions;
}





function addRandomHanabiWorld(M) {
    let A = arrayShuffle(getHanabiWorldCardNames());
    
    let listPropositions = beloteArrayToListPropositions(A);
    
    let worldName = "w" + listPropositions.join();
    M.addWorld(worldName, new HanabiWorld(listPropositions));
    
    return worldName;
}











function setExampleHanabi() {
	function getExampleHanabi() {
        let M = new EpistemicModel();
        
        let w = addRandomHanabiWorld(M);
               
        
        M.setPointedWorld(w);
        
         agents.forEach(a =>
       M.addEdgeIf(a,
        (w1, w2) =>
          getHanabiWorldCardNames().map((i) => a+i)
                .every( (p) => (w1.modelCheck(p) == w2.modelCheck(p)))));
        
        
        
        return M;
    }
        
        


    
	M = getExampleHanabi();
	
	
	
}



