'use strict';

class CherylsBirthdayWorld extends WorldValuation {
    constructor(propositions) {
        super(propositions);
        this.agentPos["a"] = {x: 24, y: 32, r: 24};
        this.agentPos["b"] = {x: 128-24, y: 32, r: 24};
        this.agentPos["c"] = undefined;
    }

	draw(context) {
        for (let date of CherylsBirthdayWorld.dates)
                if(this.modelCheck(dateToProposition(date)))
                      drawDate(context, 64, 32, date);
                
        this.drawAgents(context);
                
    }
}


CherylsBirthdayWorld.dates = [{day: 15, month: "m"},
                        {day: 16, month: "m"},
                        {day: 19, month: "m"},
                        {day: 17, month: "j"},
                        {day: 18, month: "j"},
                        {day: 14, month: "jl"},
                        {day: 16, month: "jl"},
                        {day: 14, month: "a"},
                        {day: 15, month: "a"},
                        {day: 17, month: "a"}];


function dateToProposition(date) {return date.day + date.month;}
function getFullMonth(date) {
    if(date.month == "m") return "May";
    if(date.month == "j") return "June";
    if(date.month == "jl") return "July";
    if(date.month == "a") return "August";
}


function drawDate(context, x, y, date) {
    
    let w2 = 28;
    let h2 = 32;
    context.lineWidth = 1;
    context.fillStyle="#FFFFFF";
    context.strokeStyle="#000000";
    roundRect(context, x - w2, y - h2, 2*w2, 2*h2, 5, true, true);
   
    context.fillStyle="#FF0000";
    context.strokeStyle="#000000";
    roundRect(context, x - w2, y - h2, 2*w2, 20, 5, true, true);
    
    context.font = "14px Verdana";
    context.fillStyle="#FFFFFF";
    context.fillText(getFullMonth(date), x - context.measureText(getFullMonth(date)).width/2, y - h2 +14);
    
    context.font = "24px Verdana";
    context.fillStyle="#000000";
    context.fillText(date.day, x - context.measureText(date.day).width/2, y+16);
    
}


function getExampleCherylsBirthday() {
  let M = new EpistemicModel();

  for (let date of CherylsBirthdayWorld.dates)
       M.addWorld("w" + dateToProposition(date), new CherylsBirthdayWorld([dateToProposition(date)]));
  M.makeReflexiveRelation("a");
  M.makeReflexiveRelation("b");
  M.addEdgesCluster("a", ["w15m", "w16m", "w19m"]);
  M.addEdgesCluster("a", ["w14jl", "w16jl"]);
  M.addEdgesCluster("a", ["w17j", "w18j"]);
  M.addEdgesCluster("a", ["w14a", "w15a", "w17a"]);
  M.addEdgesCluster("b", ["w15m", "w15a"]);
  M.addEdgesCluster("b", ["w16jl", "w16m"]);
  M.addEdgesCluster("b", ["w14jl", "w14a"]);
  M.addEdgesCluster("b", ["w17j", "w17a"]);

  M.setPointedWorld("w16jl");
  return M;
}
function setExampleCherylsBirthday() {

  M= getExampleCherylsBirthday();
   addExplanation("This puzzle was asked in the Singapore and Asian Schools Math Olympiad. It shows how agents a and b learn information from public messages of the form 'a does not know that...'. At the end, they will commonly know respectively the month and the date in order to guess the birthday. They initially commonly know the possible set of dates for Cheryl's birthday: 15 May, 16 May, 19 May, 17 June, 18 June, 14 July, 16 July, 14 August, 15 August, 17 August. Agent a initially know the month. Agent b initially know the day number.");

  let phi = "((not( (K a 15m) or (K a 16m) or (K a 19m) or (K a 17j) or (K a 18j) or (K a 14jl) or (K a 16jl) or (K a 14a) or (K a 15a) or (K a 17a) )) and (K a 		( not( (K b 15m) or (K b 16m) or (K b 19m) or (K b 17j) or (K b 18j) or (K b 14jl) or (K b 16jl) or (K b 14a) or (K b 15a) or (K b 17a)  ))))";
  
   addAction({label: "Agent a says he doesn't know the birthday and he knows Bernard doesn’t know either.",
              precondition: phi,
              actionModel: getActionModelPublicAnnouncement(phi),
              message:  "I don’t know when your birthday is, but I know Bernard doesn’t know either.",
              saidby: "a"
    }); 
  


  let bKnowsDate = "((K b 15m) or (K b 16m) or (K b 19m) or (K b 17j) or (K b 18j) or (K b 14jl) or (K b 16jl) or (K b 14a) or (K b 15a) or (K b 17a))";
  
   addAction({label: "Agent b says he knows the birthday.",
              precondition: bKnowsDate,
              actionModel: getActionModelPublicAnnouncement(bKnowsDate),
              message:  "Now, I know Cheryl's birthday",
              saidby: "b"
    });
  
  
// "(not((K b 15m) or (K b 16m) or (K b 19m) or (K b 17j) or (K b 18j) or (K b 14jl) or (K b 16jl) or (K b 14a) or (K b 15a) or (K b 17a) ))"	
  let aKnowsDate = "( (K a 16jl) or (K a 15a) or (K a 17a) )";
  
  addAction({label: "Agent a says he knows the birthday.",
              precondition: aKnowsDate,
              actionModel: getActionModelPublicAnnouncement(aKnowsDate),
              message:  "Well, I know Cheryl's birthday too!",
              saidby: "a"
    });

  compute();
  computeButtonsVisibleOrNot();
}
