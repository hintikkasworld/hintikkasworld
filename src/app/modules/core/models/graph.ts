export class Graph {

    protected nodes: { [id: string]: object };
    protected successors: { [key: string]: any; };
    private dotstyle: any;
    protected pointed: string;

    constructor() {
        this.nodes = {};
        this.successors = new Object();
        this.dotstyle = '';
    }


    getAgents(): string[] {
        return Object.keys(this.successors);
    }
    /**
     * @returns a dictionnary containing pairs (nodeid, node)  
     */

    getNodes() {
        return this.nodes;
    }

    removeNode(id: string): void {
        delete this.nodes[id];
        this._removeEdgesWithUndefinedNodes();
    }


    _removeEdgesWithUndefinedNodes(): void {
        for(let agent of this.getAgents())
            for(let inode in this.successors[agent])
                if(this.nodes[inode] == undefined)
                    delete this.successors[agent][inode];
                else {
                    this.successors[agent][inode] = this.successors[agent][inode].filter(inode2 => this.nodes[inode2] != undefined);
                }
    }

    removeUnvisitedNodes(visited) {
        for (let inode2 in this.nodes) {
            if (visited[inode2] == undefined) {
                delete this.nodes[inode2];
            }
        }

        this._removeEdgesWithUndefinedNodes();

    }

    /**
     * @param inodes is an array of node identifier. If inodes is not array then
     it is as if we gave the array [inodes]
    * @description remove all nodes that are not reachable from inode
    * */
    removeUnReachablePartFrom(inodes): void {
        if (!(inodes instanceof Array))
            inodes = [inodes];

        let nodesVisited = {};
        let graph = this;

        inodes.forEach(function (inode) { explore(inode); });
        this.removeUnvisitedNodes(nodesVisited);
        /*function explore(inode)
        {
        if(nodesVisited[inode])
        return;
        nodesVisited[inode] = true;
        
        for(let a in graph.successors)
        {
        if(graph.getSuccessors(inode, a) != undefined)
        for(let inode2 of graph.getSuccessors(inode, a))
        {
        explore(inode2);
        }
        }
        }*/


        function explore(inode) {
            let stack = new Array();
            stack.push(inode);

            while (stack.length > 0) {
                inode = stack.pop();
                if (!nodesVisited[inode]) {
                    nodesVisited[inode] = true;

                    for (let a in graph.successors) {
                        if (graph.getSuccessorsID(inode, a) != undefined)
                            for (let inode2 of graph.getSuccessorsID(inode, a))
                                stack.push(inode2);
                    }
                }

            }
        }
    }










    /**
     * @returns the number of nodes in the graph
     * */
    getNodesNumber(): number {
        var c = 0;

        for (let o in this.nodes)
            c++;

        return c;
    }

    /**
     * @param node, a node identifier
     * @param agent, an agent (label)
     * @returns an array of all successors of node via the agent
     * */
    getSuccessorsID(node, agent) {
        if (this.nodes[node] == undefined) throw ("getSuccessors : There is no source node of ID " + node);

        if (this.successors[agent] == undefined)
            return new Array();
        else if (this.successors[agent][node] == undefined)
            return new Array();
        else
            return this.successors[agent][node];
    }



    /**
    @param agent
    @result true iff the relation for agent is reflexive (there is a self-loop over all nodes)
    */

    isReflexive(agent: string) {
        for (let inode in this.nodes)
            if (!this.isEdge(agent, inode, inode))
                return false;
        return true;
    }

    /**
    @returns a string that represents the graph in the DOT format (for graphviz)
    */
    getDOTNotation() {

        var graphDOTnotation = "digraph G {\n     node " + this.dotstyle + "\n";

        for (var i in this.nodes) {
            graphDOTnotation += '"' + i + '" [label="' + this.nodes[i] + '"]\n';
        }

        var T = new Array();

        for (var a in this.successors)
            for (var i in this.successors[a]) {
                if (T[i] == undefined)
                    T[i] = new Array();

                for (var j in this.successors[a][i])
                    if (i != this.successors[a][i][j]) //to comments for having the loops
                    {
                        var succ = this.successors[a][i][j];
                        if (T[i][succ] == undefined)
                            T[i][succ] = new Array();

                        T[i][succ].push(a);

                    }
            }

        let arrayIsEqual = function(array, testArr) {
                if (array.length != testArr.length) return false;
                for (var i = 0; i < testArr.length; i++) {
                    if (array[i].compare) {
                        if (!array[i].compare(testArr[i])) return false;
                    }
                    if (array[i] !== testArr[i]) return false;
                }
                return true;
            }
            

        for (var i in this.nodes)
            for (var j in T[i])
                if (T[i][j] != undefined) {
                    var label = "";
                    //var comma = false;
                    for (var a in T[i][j]) {
                        /*if(comma)
                        label += "," + T[i][j][a];
                        else
                        {
                        label += T[i][j][a];
                        comma = true;
                        }*/
                        label += T[i][j][a];
                    }

                    var dirboth = "[";

                    if (j != i)
                        if (T[j][i] != undefined) {
                            if (arrayIsEqual(T[i][j], T[j][i])) {
                                dirboth = "[dir=both, ";
                                T[j][i] = undefined;
                            }

                        }

                    graphDOTnotation += '"' + i + '" -> "' + j + '"' + dirboth + 'label="' + label + '"]\n';
                }


        graphDOTnotation += "}";

        return graphDOTnotation;
    }







    /**
    @returns a clone of the graph.
    */
 /**   clone() {
        var g = new Graph();

        g.nodes = this.nodes.clone();
        g.successors = this.successors.clone();

        return g;
    }
*/


    /**
    @param idnode is the ID of the node to be added
    @param content, an objet that is the node (for e.g. a valuation)
    @description Add a node of ID idnode and of content content
    @example G.addNode("w", new Valuation(["p"]))
    */
    addNode(idnode, content) {
        if (this.nodes[idnode] != undefined)
            throw ("The structure already contains a node of ID " + idnode);

        this.nodes[idnode] = content;
    }






    /**
    @param idnode is the ID of the node to be added
    @returns the content of the node
    */
    getNode(idnode: string) {
        return this.nodes[idnode];
    }


    hasNode(idnode: string) {
        if (idnode in this.nodes) return true;
        return false;
    }

    /**
    @param agent
    @param idsource ID of the source node
    @param iddestination ID of the destination node
    @pre we suppose that the edge (idsource agent iddestination) is not in the graph
    @description Add an edge from idsource to iddestination labelled by agent
    @example G.addEdge("a", "w", "u")
    */
    addEdge(agent, idsource, iddestination) {
         if (this.nodes[idsource] == undefined) throw ("There is no source node of ID " + idsource);
        if (this.nodes[iddestination] == undefined) throw ("There is no destination node of ID " + iddestination);

        if (this.successors[agent] == undefined)
            this.successors[agent] = {};

        if (this.successors[agent][idsource] == undefined)
            this.successors[agent][idsource] = new Array();


        if (this.successors[agent][idsource].indexOf(iddestination) < 0)
            this.successors[agent][idsource].push(iddestination);


    }


    addLoop(agent, idnode) {
        this.addEdge(agent, idnode, idnode);
    }
    /**
    @param agent
    @param idnodes array of node IDs
    @description Add edges between all nodes of ID in array
    @example G.addEdgesCluster("a", ["w", "u"])
    */
    addEdgesCluster(agent, idnodes) {
        for (let i1 of idnodes)
            for (let i2 of idnodes) {
                this.addEdge(agent, i1, i2);
            }
    }


    /**
    @param agent
    @param conditionFunction is a function that takes two content nodes and that returns true
    if, with respect to the contents the two nodes should be linked by an adge labelled by agent
    @description add edges labelled by agent with respect to the function conditionFunction
    @example G.addEdgeIf("a", function(n1, n2) {return n1.modelCheck("p") == n2.modelCheck("p");})
    */
    addEdgeIf(agent, conditionFunction) {
        for (let inode1 in this.nodes)
            for (let inode2 in this.nodes)
                if (conditionFunction(this.nodes[inode1], this.nodes[inode2]))
                    this.addEdge(agent, inode1, inode2);
    }



    /**
    @param functionToCall is a function of signature (agent, idsource, iddestination)
    @description This function calls functionToCall for all edges (agent, idsource, iddestination)
    */
    edgesForEach(functionToCall) {
        for (var agent in this.successors)
            for (var nodeSourceID in this.nodes)
                if (this.successors[agent] != undefined)
                    if (this.successors[agent][nodeSourceID] != undefined)
                        for (var nodeTargetID of this.successors[agent][nodeSourceID])
                            functionToCall(agent, nodeSourceID, nodeTargetID);
    }

    /**
    @param agent
    @description The relation of agent becomes complete. That is, an edge labelled by agent
    is added between any pair of nodes
    @example G.makeCompleteRelation("a")
    */
    makeCompleteRelation(agent) {
        for (let i in this.nodes)
            for (let j in this.nodes)
                this.addEdge(agent, i, j);
    }



    /**
    @param agent
    @description The relation of agent becomes reflexive. That is, a reflexive edge labelled by agent
    is added on any node
    @example G.makeReflexiveRelation("a")
    */
    makeReflexiveRelation(agent) {
        for (let i in this.nodes)
            this.addEdge(agent, i, i);
    }


    /**
    @param agent
    @description The relation of agent becomes symmetric. That is, if w --a--> u exists,
    then u --a--> w is added
    @example G.makeSymmetricRelation("a")
    */
    makeSymmetricRelation(agent) {
        for (let i in this.nodes)
            for (let j in this.nodes)
                if (this.isEdge(agent, i, j))
                    this.addEdge(agent, j, i);
    }

    /**
    @param agent
    @param idsource
    @param iddestination
    @returns true if there is an edge from idsource to iddestination  labelled by agent
    @example G.isEdge("a", "w", "u")
    */
    isEdge(agent, idsource, iddestination) {
        if (this.successors[agent] == undefined)
            return false;

        if (this.successors[agent][idsource] == undefined)
            return false;

        return this.successors[agent][idsource].indexOf(iddestination) > -1;

    }







    dfs(sourceNode, maxDistance) {
        let visited = {};
        let queue = [];
        queue.push(sourceNode);
        visited[sourceNode] = { distance: 0, parent: null };

        while (queue.length != 0) {
            let world = queue.shift();
            for (let a of this.getAgents())
                for (let u of this.getSuccessorsID(world, a))
                    if (visited[u] == undefined) {
                        if (visited[world].distance >= maxDistance) {
                            return visited;
                        }


                        visited[u] = { distance: visited[world].distance + 1, parent: world, agent: a };
                        queue.push(u);
                    }
        }
        return visited;
    }




    pruneBehond(depth) {
        let visited = this.dfs(this.getPointedNode(), depth);
        this.removeUnvisitedNodes(visited);
    }



    getShortestPathVisited(sourceNode, destinationNode) {
        let visited = {};
        let queue = [];
        queue.push(sourceNode);
        visited[sourceNode] = { distance: 0, parent: null };

        while (queue.length != 0) {
            let world = queue.shift();

            if (world == destinationNode) {
                return visited;
            }
            for (let a of this.getAgents())
                for (let u of this.getSuccessorsID(world, a))
                    if (visited[u] == undefined) {
                        visited[u] = { distance: visited[world].distance + 1, parent: world, agent: a };
                        queue.push(u);
                    }
        }
        return undefined;
    }




    /**
    @param sourceNode ID of a source node
    @param destinationNode ID of a destination node
    @returns a shortest path from sourceNode to destinationNode or undefined if
    no path exists.
    The is represented as follows:
    [{agent: a1, world: n1}, {agent: a1, world: n2}, ... {agent: ak, world: nk}]
    if the shortest path is
    sourceNode --a1--> n1 --a2--> n2 --.............. --ak--> nk = destinationNode
    @example G.getShortestPath("w", "u")
    **/
    getShortestPath(sourceNode, destinationNode) {
        let visited = this.getShortestPathVisited(sourceNode, destinationNode);

        if (visited == undefined)
            return undefined;

        let path = [];
        let world = destinationNode;
        while (visited[world].parent != null) {
            path.unshift({ world: world, agent: visited[world].agent });
            world = visited[world].parent;
        }

        return path;
    }




    /**
     @param w ID of a node
    @example G.setPointedNode("w")
    **/
    setPointedNode(w) {
        if (this.nodes[w] == undefined)
            throw ("the graph does not contain any node of ID " + w);
        this.pointed = w;
    }


    /**
    @returns the ID of the pointed node
    **/
    getPointedNode() {
        return this.pointed;
    }

}

