'use strict';

/**
Knowledge-based programs are like:

e;
while("(not (know a p))")
{
	if("(know a q)")
		a;
	else
	{
		b;
		c;
	}
}
*/

/**
@param programExpression a string that represents a knowledge-based program
@return the corresponding knowledge-based program (i.e. its abstract syntax tree)
@example createKnowledgeBasedProgram("while('(not (know a p))') { if('(know a q)') {A;B;} else {C;}}")
@example = createKnowledgeBasedProgram("A; if('(know a q)') {A;B;} else {C;}")
*/
function createKnowledgeBasedProgram(programExpression) {
  return esprimaToAST(esprima.parse(programExpression));
}




/**
@param esprimaTree the abstract syntaxic tree returned by the esprima library
@return the abstract syntactic tree used by us
@description it performs some cleanup
*/
function esprimaToAST(esprimaTree)
{
  if(esprimaTree instanceof Array)
  {
    return esprimaTree.map(esprimaToAST);
  }
  else //it is an object
  {
      if(esprimaTree.type == "Program" || esprimaTree.type == "BlockStatement" )
        return esprimaToAST(esprimaTree.body);
      else if(esprimaTree.type == "WhileStatement") {
        return {type: "WhileStatement", test: createFormula(esprimaTree.test.value), body: esprimaToAST(esprimaTree.body)};
      }
      else if(esprimaTree.type == "IfStatement") {
        let consequentAST = esprimaToAST(esprimaTree.consequent);
        let alternateAST = esprimaToAST(esprimaTree.alternate);

        if(!(consequentAST instanceof Array))
          consequentAST = [consequentAST];

        if(!(alternateAST instanceof Array))
            alternateAST = [alternateAST];

        return {type: "IfStatement", test: createFormula(esprimaTree.test.value),
                consequent: consequentAST,
                alternate: alternateAST};
      }
      else if(esprimaTree.type == "ExpressionStatement")
      {
        if(esprimaTree.expression.name == undefined)
          console.log("I can not understand an action in a program.")
        return {type: "Action", "name": esprimaTree.expression.name};
      }
      else {
        console.log(JSON.stringify(esprimaTree));
      }

  }

}










/**
@param kbp a knowledge-based program (abstract syntactic tree). The kbp should be
      of the form "start; ...."
@return the program counter graph with ---0---> and ---1---> edges
*/
function getProgramCounterGraph01(kbp)
{
  let PCs = new SetOfObjects();
  let edges = new SetOfObjects();
  let changed = true;

  let pcinit = {formula: "top", program: kbp};
  PCs.add(pcinit);

  while(changed) {
    changed = false;
    for(var pc of PCs.set)
        if(pc.program.length > 0)
        {
          if(pc.program[0].type == "Action") {
              var pc2 = {formula: "top", program: pc.program.slice(1)};
              changed = changed || PCs.add(pc2);
              edges.add({pc1: pc, pc2: pc2, weight: 1, action: pc.program[0].name});
          }
          if(pc.program[0].type == "IfStatement") {
              var pc2c = {formula: [pc.program[0].test , "and" , pc.formula],
                                            program: pc.program[0].consequent.concat(pc.program.slice(1))};

              var pc2a = {formula: [["not", pc.program[0].test], "and", pc.formula],
                                            program: pc.program[0].alternate.concat(pc.program.slice(1))};

              changed = changed || PCs.add(pc2c);
              changed = changed || PCs.add(pc2a);

              edges.add({pc1: pc, pc2: pc2c, weight: 0});
              edges.add({pc1: pc, pc2: pc2a, weight: 0});
          }
        }
  }


  let stringToIntArray = getStringIntArrayFromStringSetTo(PCs.setJSON);

  return {pcinit: stringToIntArray[JSON.stringify(pcinit)],
          nodes: [...PCs.set],
          edges: [...edges.set].map(function(edge)  {
                                      edge.pc1 = stringToIntArray[JSON.stringify(edge.pc1)];
                                      edge.pc2 = stringToIntArray[JSON.stringify(edge.pc2)];
                                      return edge;  }),
          isPCActionToExecute: function(node)
                                {
                                  if(this.nodes[node].program.length == 0)
                                    return false;
                                  else
                                    return (this.nodes[node].program[0].type == "Action");
                                },
          isPCFinal: function(node)
                                {
                                  if(this.nodes[node].program.length == 0)
                                    return true;
                                  else
                                    return false;
                                },
          getSuccessors0: function(node)
                          {
                              return this.edges.filter(function(edge) {return (edge.pc1 == node) && (edge.weight == 0);})
                                          .map(function(edge) {return edge.pc2});
                          },
          getSuccessor1: function(node)
                          {
                              var S = this.edges.filter(function(edge) {return (edge.pc1 == node) && (edge.weight == 1);});
                              if(S.length == 0)
                                 return undefined;
                              else
                                 return S[0].pc2;
                          },
          getAction: function(node) {
                if(this.nodes[node].program.length == 0)
                  return undefined;
                else
                {
                    return this.nodes[node].program[0].name;
                }

          },
          getPrecondition: function(node) {
                return this.nodes[node].formula;
          }};
}

















//getProgramCounterGraph(createKnowledgeBasedProgram("exitMuseum(); if('(know a wet)') goToStation(); else goToPark();"));
function getProgramCounterGraph(kbp) {
  var G = getProgramCounterGraph01(kbp);

  var nodes = new Set();
  var successors = new Array();
  var changed = true;

  nodes.add(G.pcinit);

  while(changed)
  {
      changed = false;

      for(var node of nodes)
      {
          if(successors[node] == undefined)
          {
            successors[node] = new Set();
            var succ = G.getSuccessor1(node);

            if(succ != undefined)
              successors[node].add(succ);
            changed = true;
          }

          for(var node2 of successors[node])
          {
              if(G.isPCActionToExecute(node2) || G.isPCFinal(node2))
              {
                if(!nodes.has(node2))
                {
                  changed = true;
                  nodes.add(node2);
                }
              }

              else
              {
                  successors[node].delete(node2);
                  for(let node3 of G.getSuccessors0(node2))
                  {
                    successors[node].add(node3);
                  }
                  changed = true;

              }
          }


      }


  }

  G.nodesActionToBeExecuted = [...nodes];
  G.successorsWhereActionToBeExecuted = successors;

  G.getImportantPCs = function()
  {
    return this.nodesActionToBeExecuted;
  }

  G.getSuccessors = function(node)
  {
    return this.successorsWhereActionToBeExecuted[node];
  }

  return G;
}
