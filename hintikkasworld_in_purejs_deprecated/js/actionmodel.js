'use strict';

/**
 * Create a new empty action model
 * @class ActionModel
 * @extends Graph
 */
class ActionModel extends Graph
{

  	setPointedAction(e){
      if(this.nodes[e] == undefined)
  			throwError( "the action model does not contain any world of ID " + e);


  		this.setPointedNode(e);
  	}

  	getPointedAction(e){
  		return this.getPointedNode();
  	}




/*	this.nodes = new Array();
	this.successors = new Array();
	this.dotstyle = "[shape=box, fillcolor=lightblue2, style=filled]";*/

	/**
	 * @memberof ActionModel
	 * @param e event identifier
	 * @param pre a precondition (a formula).
	 * @param post a postcondition (an object that represents the postcondition).
	 If post is undefined/unspecified, then the postcondition is trivial
	 If post is an associate array then post is implicitely replaced by
	 new PropositionalAssignmentsPostcondition(post)
	 * @example E.addAction("e1", createFormula("(K a p)"))
	 * @example E.addAction("e1", "(K a p)")
	 * @example E.addAction("e1", "(K a p)", {"p": "(K a q)", "q": "(not p)"})
	 * */
  	addAction(e, pre, post)
	{
		if(typeof(pre) == "string")
				pre = createFormula(pre);
    
		if(post == undefined)
		     post = new TrivialPostCondition();
	  else if(post.constructor.name == "Object")
				post = new PropositionalAssignmentsPostcondition(post);

      
      
       this.addNode(e, {pre: pre,
		                 post: post,
	                     getShortDescription: function() {if(post.toString() == "idle")
                                                                return "pre: " + formulaPrettyPrint(this.pre);
                                                          else
                                                                return "pre: " + formulaPrettyPrint(this.pre) + "; post: " + post.toString()}
		                // toHTML: function() {return ' <table><tr><td>pre: </td><td>' + formulaPrettyPrint(this.pre) + '</td></tr><tr><td>post: </td><td>' + post.toString() + '</td></tr></table>'}
		});
	}





/**
@descrption Same specification as addAction.
*/
  addEvent(e, pre, post)
  {
      this.addAction(e, pre, post)
  }
	/**
	 * @param e event identifier
	 * @returns (the internal representation of) a formula that is the
	 precondition of e
	 * */
	getPrecondition(e)
	{
			if(this.nodes[e] == undefined)
				console.log(e);
	    return this.nodes[e].pre;
	}

	/**
	 * @param e event identifier
	 * @returns the postcondition of e. The postcondition is an object that
	 should implement
	 * */
	getPostcondition(e)
	{
	    return this.nodes[e].post;
	}

}














/**
@class TrivialPostCondition
@constructor
@return a postcondition that does not change anything. */
function TrivialPostCondition()
{
    this.perform = function(M, w)
    {
				return M.getNode(w);
    }

    this.toString = function()
    {
      return "idle";
    }

}




function getActionModelPublicAnnouncement(announcementSchemeExpression, allAgents) {
    if(allAgents == undefined)
        allAgents = agents;
	var E = new ActionModel();
	E.addAction("e", createFormula(announcementSchemeExpression), new TrivialPostCondition());

	for(let a of allAgents)
			E.addEdge(a, "e", "e");

  E.setPointedAction("e");

	return E;

}

function getActionModelPrivateAnnouncement(announcementSchemeExpression, agent, allAgents) {
    if(allAgents == undefined)
        allAgents = agents;
	var E = new ActionModel();
  E.addAction("e", createFormula(announcementSchemeExpression), new TrivialPostCondition());
	E.addAction("t", createFormula("top"), new TrivialPostCondition());


	E.addEdge(agent, "e", "e");
	E.addEdge(agent, "t", "t");
  E.setPointedAction("e");

	for(let a of allAgents)
	if(a != agent)
	{
			E.addEdge(a, "e", "t");
			E.addEdge(a, "t", "t");

	}

	return E;
}



function getActionModelSemiPrivateAnnouncement(announcementSchemeExpression, agent, allAgents)
{
    if(allAgents == undefined)
        allAgents = agents;
    
	var E = new ActionModel();
  E.addAction("e", createFormula(announcementSchemeExpression), new TrivialPostCondition());
	E.addAction("t", createFormula("(not " + announcementSchemeExpression + ")"), new TrivialPostCondition());


	E.addEdge(agent, "e", "e");
	E.addEdge(agent, "t", "t");
  E.setPointedAction("e");

	for(let a of allAgents)
	if(a != agent)
	{
			E.addEdge(a, "e", "t");
      E.addEdge(a, "t", "e");
			E.addEdge(a, "t", "t");
      E.addEdge(a, "e", "e");

	}

	return E;
}




/**
Synonym for ActionModel
*/
let EventModel = ActionModel;
