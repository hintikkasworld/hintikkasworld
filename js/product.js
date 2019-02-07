'use strict';

/**
 * @param a world identifier w
 * @param an event identifier e
 * @returns the identifier of (w, e)
 */
function createWorldActionName(w, e)
{
    //return "(" + w + ", " + e + ")";
    return w + "_" + e;
}


function getActionFromWorldAction(we)
{
  let i = we.lastIndexOf("_");
  return we.substring(i);
}


function getWorldFromWorldAction(we)
{
  let i = we.lastIndexOf("_");
  return we.substring(0, i);
}
/**
 * @param M epistemic model
 * @param E action model
 * @returns the epistemic model that is the product of M and E
 */
function product(M, E) {
    let ME = new EpistemicModel();
    let agents = ["a", "b", "c"];

    for(var w in M.nodes)
    for(var e in E.nodes) {
      if(M.modelCheck(w, E.getPrecondition(e)))  {
        let we = createWorldActionName(w, e);

        let newcontent = E.getPostcondition(e).perform(M, w);
        newcontent.lastWorldID = w;
	      ME.nodes[we] = newcontent;
      }
    }

    for(let a of agents)
        ME.successors[a] = {};
    
    for(let w1 in M.nodes)
    for(let e1 in E.nodes) {
        let we1 = createWorldActionName(w1, e1);
        if(ME.nodes[we1] != undefined) {
            for(let a of agents) {
                let succw1 = M.getSuccessors(w1, a);
                let succe1 = E.getSuccessors(e1, a);
                ME.successors[a][we1] = new Array(succw1.length * succe1.length);
                
                let i = 0;
                for(let w2 of succw1)
                for(let e2 of succe1) {
                    let we2 = createWorldActionName(w2, e2);
                    if(ME.nodes[we2] != undefined) {
                        ME.successors[a][we1][i] = we2;
                        i++;
                    }
                        //ME.addEdge(a, we1, we2);
                 ME.successors[a][we1].length = i;
            }
            
            }
        }
    }


    if(M.getPointedWorld() != undefined && E.getPointedAction() != undefined)
    {
      let we = createWorldActionName(M.getPointedWorld(), E.getPointedAction());
      if(ME.hasNode(we))
          ME.setPointedWorld(we);
    }


    return ME;

}



/**
 * @param M epistemic model
 * @param Elist an array of action models
 * @returns the product of M and all the action models in Elist
 *
 *
 */
function products(M, Elist)
{
    var Mresult = M;
    for(var E of Elist)
    {
      Mresult = product(Mresult, E);
    }

    return Mresult;
}
