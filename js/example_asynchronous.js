let agentsInTheAsynchronousExample = ["a", "b"];
var possibleMessages = [createFormula("(K a p)"),   createFormula("p")];

/**
 * @param truePropositions an array of true propositions
 * @returns a state where the public channel is empty and truePropositions give the valuation
 * @example new AsynchronousWorld(["p", "q"])
 * */
 class AsynchronousWorld extends WorldValuation {
   constructor(propositions) {
       super(propositions);
       this.xbase = 80;
       let r = 16;
       this.agentPos["a"] = {x: this.xbase, y: r, r: r};
       this.agentPos["b"] = {x: this.xbase+2*r, y: r, r: r};
       this.agentPos["c"] = undefined;
       this.queue = new Array();
       this.cut = new Array();

       for(let a of agentsInTheAsynchronousExample)
           this.cut[a] = 0;
   }



   modelCheck(p) {
     if(p instanceof Array) {
          if(p[0] == "hasmessage")
          {
            return this.cut[p[1]] < this.queue.length;
          }
          else
          if(p[0] == "nextmessage")
          {
              if(this.cut[p[1]] >= this.queue.length)
                return false;
              else
                return (this.queue[this.cut[p[1]]] == p[2]);
          } else if(p[0] == "queue-contains")
              {
                for(let msg of this.queue)
                  if(msg == p[1])
                    return true;
                return false;
              }
      }
      else
      if(p == "over")
        return (this.queue.length >= 2);
       else
          return super.modelCheck(p);
   }

   draw(context) {
       this.drawAgents(context);
       context.font="10px Verdana";
       context.strokeStyle="#000000";

       context.drawImage(SimpleWorld.basketImg, 0, 0, 32, 32);

       if(this.modelCheck("p"))
         context.drawImage(SimpleWorld.basketWithMarbleImg, 0, 0, 32, 32);

       for(let i = 0; i < this.queue.length; i++)
       {
          let txtphi = formulaPrettyPrint(this.queue[i]);
          context.strokeText(txtphi, 0, 40 + i*10);
       }
       for(let a of agentsInTheAsynchronousExample) {
          for(let i = 0; i < this.cut[a]; i++)
            context.strokeText("✓", this.agentPos[a].x-6, 40 + i*10);

       }
     }


     toString()
     {
        return super.toString() + "|" + this.queue.join(";") + "|" + this.cut["a"] + "," + this.cut["b"];
     }


}













class ReceiveMessagePostCondition {
  constructor(agent) {
    this.agent = agent;
  }

  perform(M,w) {
    var s2 = clone(M.nodes[w]);
      if(s2.cut[this.agent] < s2.queue.length)
         s2.cut[this.agent]++;
    return s2;
  }
}


class PushMessagePostCondition {
  constructor(phi)
  {
    this.phi = phi;
  }

  perform(M,w)
  {
    var s2 = clone(M.nodes[w]);
    s2.queue.push(this.phi);

    return s2;

  }
}





function getPreconditionNewMessage(msg)
{
  return createConjunction(msg, [["not", "over"], "and", ["not", ["queue-contains", msg] ]]);
}


/*
function SEND(msg, agent)
{
  var E = new ActionModel();
  E.addAction("e", msg, new PushMessagePostCondition(msg));
  E.addAction("f", "top", new TrivialPostCondition());

  if(agent == "a")
  {
    E.makeCompleteRelation("b");
    E.makeCompleteRelation("c");
  }
  else if(agent == "b")
  {
    E.makeCompleteRelation("a");
    E.makeCompleteRelation("c");
  }
  else
  {
    E.makeCompleteRelation("a");
    E.makeCompleteRelation("b");
  }

  E.makeReflexiveRelation("a");
  E.makeReflexiveRelation("b");
  E.makeReflexiveRelation("c");
  E.setPointedAction("e");
  return E;
}*/
function imgNEWMSG()
{
  var E = new ActionModel();

  for(let msg of possibleMessages)
        E.addAction("e" + msg, getPreconditionNewMessage(msg), new PushMessagePostCondition(msg));
  E.addAction("idle", "top", new TrivialPostCondition());
  E.makeCompleteRelation("a");
  E.makeCompleteRelation("b");
  E.setPointedAction("idle");
  return E;
}



function imgREC(agent)
{
  var E = new ActionModel();

  for(var m of possibleMessages)
      E.addAction("r_" + m, ["nextmessage", agent, m], new ReceiveMessagePostCondition(agent));

  E.addAction("idle", "top", new TrivialPostCondition());

  if(agent == "a")
    E.makeCompleteRelation("b");
  else if(agent == "b")
    E.makeCompleteRelation("a");

  E.makeReflexiveRelation("a");
  E.makeReflexiveRelation("b");
  E.setPointedAction("idle");
  return E;

}




















function performNEWMSG(msg)
{
  let E = imgNEWMSG();
  E.setPointedAction("e" + msg);
  performAction(E);
  imaginePossibleAsynchronousActions();
  /*
  M = product(M,E);
  imaginePossibleAsynchronousActions();
  openWorlds = getOpenWorldsAfterAction(E, openWorlds);
  showEpistemicModel(M);
  compute(0);
  computeButtonsVisibleOrNot();*/
}



function performREC(agent)
{
  let E = imgREC(agent);
  let w = M.getNode(M.getPointedWorld());
  let msg = w.queue[w.cut[agent]];
  E.setPointedAction("r_" + msg);
  performAction(E);
  imaginePossibleAsynchronousActions();/*
  M = product(M,E);
  imaginePossibleAsynchronousActions();
  openWorlds = getOpenWorldsAfterAction(E, openWorlds);
  showEpistemicModel(M);
  compute(0);
  computeButtonsVisibleOrNot();*/
}


function imaginePossibleAsynchronousActions()
{
  for(let i = 0; i<5; i++)
  {
    performAction(imgNEWMSG());
    //M = product(M, imgNEWMSG());

    for(let agent of agentsInTheAsynchronousExample)
      performAction(imgREC(agent));
      //M = product(M, imgREC(agent));

  }
}

function setExampleAsynchronous() {
  M= new EpistemicModel();
  M.addWorld("w", new AsynchronousWorld(["p"]));
  M.addWorld("u", new AsynchronousWorld([]));
  M.setPointedWorld("w");

  for(let agent of agentsInTheAsynchronousExample)
      M.makeCompleteRelation(agent);
      imaginePossibleAsynchronousActions();




  addExplanation("This example shows agents in an asynchronous setting. It illustrates the setting in the article " +
  "<a href='https://www.cambridge.org/core/journals/mathematical-structures-in-computer-science/article/reasoning-about-knowledge-and-messages-in-asynchronous-multiagent-systems/CF8CF67DBE7EE3ABCBE621A09D397DC5' target='_blank'>[Knight, Maubert, Sch., 2017]</a>. " +
  "Each agent may have received msgs before/after others. Possibles messages are 'p' (standing for there is a marble in the basket) and 'a knows p'. There are sent at most once. The asynchronous machinary is commonly known.");

  for(let msg of possibleMessages)
      addButtonAction(function() {performNEWMSG(msg)}, "broadcast " + formulaPrettyPrint(msg), formulaPrettyPrint(getPreconditionNewMessage(msg)));

  for(let agent of agentsInTheAsynchronousExample)
      addButtonAction(function() {performREC(agent)}, agent + " reads its next message", "(hasmessage "+agent + ")");

            compute();
            computeButtonsVisibleOrNot();

}
