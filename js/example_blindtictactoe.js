class BlindTicTacToeWorld extends WorldValuation {
  constructor(propositions)
  {
      super(propositions);
      this.agentPos["a"] = {x: 16, y: 32, r: 16};
      this.agentPos["b"] = {x: 128-16, y: 32, r: 16};
      this.agentPos["c"] = undefined;
      
      this.xt = 38;
      this.yt = 0;
      this.cellSize = 16;
      
  }
  
  
  
  draw(context) {
      this.drawAgents(context);
      
      context.strokeStyle = "black";
      for(let x = 1;  x <= 2; x++) {
        context.beginPath();  
        context.moveTo(this.xt + x * this.cellSize, this.yt);
        context.lineTo(this.xt + x * this.cellSize, this.yt + 3*this.cellSize);
        context.stroke();    
      }
      for(let y = 1;  y <= 2; y++) {
        context.beginPath();
        context.moveTo(this.xt, this.yt +  y * this.cellSize);
        context.lineTo(this.xt + 3 * this.cellSize, this.yt + y * this.cellSize);
        context.stroke();    
      }
      
      
      //a plays X, b plays O
      for(let x = 0; x <= 2; x++)
          for(let y = 0;  y <= 2; y++) {
                let xc = this.xt + x * this.cellSize + this.cellSize / 2;
                let yc = this.yt + y * this.cellSize + this.cellSize / 2;
                if(this.modelCheck("b" + x + y)) {
                    context.strokeStyle = "blue";
                    context.beginPath();
                    context.arc(xc, yc, 5, 0, Math.PI * 2);
                    context.stroke();
                    
                }
                 
                let Xsize = 5;
                if(this.modelCheck("a" + x + y)) {
                    context.strokeStyle = "red";
                    drawLine(context, xc - Xsize, yc - Xsize, xc + Xsize, yc + Xsize);
                    drawLine(context, xc - Xsize, yc + Xsize, xc + Xsize, yc - Xsize);
                    
                }
          }
          
      if(this.modelCheck("turna"))
          this.drawAgentSelection(context, "a");
      else
          this.drawAgentSelection(context, "b");
  }
  
  
  getCell(point) {
      if(point.x < this.xt)
          return undefined;
      
      if(point.x > this.xt + 3*this.cellSize)
          return undefined;
      
      if(point.y < this.yt)
          return undefined;
      
      if(point.y > this.yt + 3*this.cellSize)
          return undefined;
      
      return {x: Math.floor((point.x - this.xt) / this.cellSize), y: Math.floor((point.y - this.yt) / this.cellSize)};
  }
}






function getBlindTicTacToeInitialKripkeModel() {
   let M = new EpistemicModel();
   M.addWorld("w", new BlindTicTacToeWorld(["turna"]));
   M.makeReflexiveRelation("a");
   M.makeReflexiveRelation("b");
   M.setPointedWorld("w");
   return M;
}



function getEventModelPubliclyPlay(agent, cell) {
  let E = new ActionModel();
  let post = {};
  post[agent + cell.x + cell.y] = "top";
  post["turna"] = "(not turna)";
  
  E.addAction("e", "top", post);
  E.makeReflexiveRelation("a");
  E.makeReflexiveRelation("b");
  E.setPointedAction("e");
  return E;
}






function getEventModelBlindPlay(agent, cell) {
  let E = new ActionModel();
  let playXYeventIDs = [];
  let infoXYeventIDs = [];
  let agent2 = (agent == "a") ? "b" : "a";
  for(let x = 0; x <= 2; x++)
    for(let y = 0;  y <= 2; y++) {
        let post = {};
        post[agent + x + y] = "top";
        post["turna"] = "(not turna)";
        E.addAction("play"  + x + y, "((not " + agent + x + y + ") and (not " + agent2 + x + y + "))", post);
        playXYeventIDs.push("play"  + x + y);
        
        E.addAction("info"  + x + y, "((not " + agent + x + y + ") and " + agent2 + x + y + ")");
        infoXYeventIDs.push("info"  + x + y);
  }
  
  E.addEdgesCluster(agent2, playXYeventIDs);
  E.addEdgesCluster(agent2, infoXYeventIDs);
  E.makeReflexiveRelation(agent);
  

  if(M.modelCheck(M.getPointedWorld(), createFormula("((not " + agent + cell.x + cell.y + ") and (not " + agent2 + cell.x + cell.y + "))")))
      E.setPointedAction("play" + cell.x + cell.y);
  else if(M.modelCheck(M.getPointedWorld(), createFormula("((not " + agent + cell.x + cell.y + ") and " + agent2 + cell.x + cell.y + ")")))
      E.setPointedAction("info" + cell.x + cell.y);
  else
      return undefined;

  return E;
}







function onBlindTicTacToeRealWorldClick(evt) {
    let agent;
    if(M.modelCheck(M.getPointedWorld(), "turna"))
        agent = "a";
    else
        agent = "b";
    
    console.log(evt);
    let cell = M.getNode(M.getPointedWorld()).getCell(evt);
    
    if(cell == undefined)
        return;
    
    let E = getEventModelBlindPlay(agent, cell);
    
    if(E == undefined)
        speak(agent, "oh, I already played there");
    else {
        M.pruneBehond(1);   
        performAction(E);
    }
      
    
    
}


function setExampleBlindTicTacToe() {
    M = getBlindTicTacToeInitialKripkeModel();   
    addExplanation("This example shows a blind version of Tic Tac Toe.");
    setOnRealWorldClick(onBlindTicTacToeRealWorldClick);
    
    compute();
    computeButtonsVisibleOrNot();
}
