class NanoHanabiWorld extends WorldValuation{
  constructor(propositions) {
      super(propositions);
      this.agentPos["a"] = {x: 32, y: 32, r: 16};
      this.agentPos["b"] = {x: 68+32+10, y: 32, r: 16};
      this.agentPos["c"] = {x: 68+5, y: 32, r: 1};;
  }
  draw(context) {
      this.drawAgents(context);
      context.font="12px Verdana";
      context.strokeStyle="#000000";
      for(var a of ["a", "b"])
      for(var pos of ["l", "", "r"])
      for(var i = 1; i <= 4; i++) {
        let xshift;
        
        if(pos == "l")
            xshift = -16;
        else if(pos == "")
            xshift = -9;
        else
            xshift = -2;
        
        if(this.modelCheck(a + pos + i))
          drawCard(context, {x: this.agentPos[a].x+xshift, y: 12, w: 16, text: i});
      }
      for(var i = 0; i <=4; i++){
        if(this.modelCheck("c"+i))
          drawCard(context, {x: this.agentPos["c"].x-4, y: 12, w: 16, text: i});
      }

      if(this.modelCheck("c4")){
        context.strokeStyle="#00000";
        context.strokeText("WINNER!", this.agentPos["c"].x-30,12);
    }
  }
}

function setExampleNanoHanabi(){
  var al,ar,bl,br;
  function getExampleNanoHanabi(){
    const permutator = (inputArr) => {
      let result = [];

      const permute = (arr, m = []) => {
        if (arr.length === 0) {
          result.push(m)
        } else {
          for (let i = 0; i < arr.length; i++) {
            let curr = arr.slice();
            let next = curr.splice(i, 1);
            permute(curr.slice(), m.concat(next))
         }
       }
     }

     permute(inputArr)

     return result;
    }
    let M= new EpistemicModel();
    let permutations= permutator([1,2,3,4]);
    //console.log(permutations);
    for(permutation of permutations){
      M.addWorld("w"+permutation[0]+permutation[1]+permutation[2]+permutation[3], new NanoHanabiWorld(["al"+permutation[0],"ar"+permutation[1],"bl"+permutation[2],"br"+permutation[3],"c0"]));
    }

   let ab = ["a","b"];
  var b;
    ab.forEach( a =>
    //var a="a";
      M.addEdgeIf(a, function(w1, w2) {
        if(a=="a"){
          b="b";
        }else {
          b="a";
        }
      if( w1.modelCheck("c0") && w2.modelCheck("c0")){
        for(var i=1;i<=4;i++){
          if( w1.modelCheck(b+"l"+i) !== w2.modelCheck(b+"l"+i))
              return false;
          if( w1.modelCheck(b+"r"+i) !== w2.modelCheck(b+"r"+i))
              return false;
          }
        }else return false;
        return true;
      }));



    var selected = getRandomInt(0,24);
    var pointed = permutations[selected];

    M.setPointedWorld("w"+pointed[0]+pointed[1]+pointed[2]+pointed[3]);
    al=pointed[0];
    ar=pointed[1];
    bl=pointed[2];
    br=pointed[3];
  //  M.setPointedWorld("wp1a234");
    M.removeUnReachablePartFrom("w"+pointed[0]+pointed[1]+pointed[2]+pointed[3]);
    return M;
  }

  M = getExampleNanoHanabi();

  function playAleft(){

    var E = new ActionModel();
    if(M.getNode(M.getPointedWorld()).modelCheck("c"+(al-1))){
     var id = "al"+al;
     var id1 = "c"+(al-1);
     var id2="c"+al;
     let post = {};
     post[id] = "bottom";
     post[id1] = "bottom";
     post[id2] = "top";
    E.addAction("e", "( K a ( al"+al+"))", post);
    E.setPointedAction("e");
  }else{
    E.addAction("f","top");
    E.setPointedAction("f");
  }
    E.makeReflexiveRelation("a");
    E.makeReflexiveRelation("b");

    return E;
  }

  function playAright(){
    var E = new ActionModel();
    if(M.getNode(M.getPointedWorld()).modelCheck("c"+(ar-1))){
      console.log(ar);
     var id = "ar"+ar;
     var id1 = "c"+(ar-1);
     var id2="c"+ar;
     let post = {};
     post[id] = "bottom";
     post[id1] = "bottom";
     post[id2] = "top";
    E.addAction("e", "( K a ( ar"+ar+"))", post);
    E.setPointedAction("e");
  }else{
    E.addAction("f","top");
    E.setPointedAction("f");
  }
    E.makeReflexiveRelation("a");
    E.makeReflexiveRelation("b");

    return E;
  }

  function playBleft(){

    var E = new ActionModel();
    if(M.getNode(M.getPointedWorld()).modelCheck("c"+(bl-1))){
     var id = "bl"+bl;
     var id1 = "c"+(bl-1);
     var id2="c"+bl;
     let post = {};
     post[id] = "bottom";
     post[id1] = "bottom";
     post[id2] = "top";
    E.addAction("e", "( K b ( bl"+bl+"))", post);
    E.setPointedAction("e");
  }else{
    E.addAction("f","top");
    E.setPointedAction("f");
  }
    E.makeReflexiveRelation("a");
    E.makeReflexiveRelation("b");

    return E;
  }

  function playBright(){
    var E = new ActionModel();
    if(M.getNode(M.getPointedWorld()).modelCheck("c"+(br-1))){
    let post = {};
    post["br"+br] = "bottom";
    post["c"+(br-1)] = "bottom";
    post["c"+br] = "top";
    E.addAction("e", "( K b ( br"+br+"))", post);
    E.setPointedAction("e");
  }else{
    E.addAction("f","top");
    E.setPointedAction("f");
  }
    E.makeReflexiveRelation("a");
    E.makeReflexiveRelation("b");

    return E;
  }


   addExplanation("This example shows a very simplified version of the game Hanabi, with only one color and four cards.");

    addAction({label: "Agent a gives indication.",
              precondition: "(K a ( not  bl"+br+" ) )",
              actionModel: getActionModelPublicAnnouncement("(K a ( not  bl"+br+" ) )", ["a", "b"]),
              message:  "You're left card isn't "+br,
              saidby: "a"
    });
    
   addAction({label: "Agent b gives indication.",
              precondition: "(K b ( not  al"+ar+" ) )",
              actionModel: getActionModelPublicAnnouncement("(K b ( not  al"+ar+" ) )", ["a", "b"]),
              message:  "You're left card isn't "+ar,
              saidby: "b"
    });

   addAction({label: "Agent a plays left card.",
              precondition: "( K a ( al"+al+" ))",
              actionModel: playAleft
    });
   
   addAction({label: "Agent a plays right card.",
              precondition: "( K a ( ar"+ar+" ))",
              actionModel: playAright
    });
   
    addAction({label: "Agent b plays left card.",
              precondition: "( K b ( bl"+bl+" ))",
              actionModel: playBleft
    });
   
   addAction({label: "Agent b plays right card.",
              precondition: "( K b ( br"+br+" ))",
              actionModel: playBright
    });

  compute();
  computeButtonsVisibleOrNot();


}
