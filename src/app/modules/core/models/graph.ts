export class Graph<T> {
    protected nodes: { [id: string]: T };
    protected successors: { [agent: string]: { [id: string]: string[] } };
    private dotstyle: any;
    protected pointed: string;

    constructor() {
        this.nodes = {};
        this.successors = {};
        this.dotstyle = '';
    }

    getAgents(): string[] {
        return Object.keys(this.successors);
    }

    /**
     * @returns a dictionnary containing pairs (nodeid, node)
     */

    getNodes(): { [id: string]: T } {
        return this.nodes;
    }

    removeNode(id: string): void {
        delete this.nodes[id];
        this._removeEdgesWithUndefinedNodes();
    }

    _removeEdgesWithUndefinedNodes(): void {
        for (let agent of this.getAgents()) {
            for (let inode in this.successors[agent]) {
                if (this.nodes[inode] == undefined) {
                    delete this.successors[agent][inode];
                } else {
                    this.successors[agent][inode] = this.successors[agent][inode].filter((inode2) => this.nodes[inode2] != undefined);
                }
            }
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
        if (!(inodes instanceof Array)) {
            inodes = [inodes];
        }

        let nodesVisited = {};
        let graph = this;

        inodes.forEach(function (inode) {
            explore(inode);
        });
        this.removeUnvisitedNodes(nodesVisited);

        function explore(inode) {
            let stack = [];
            stack.push(inode);

            while (stack.length > 0) {
                inode = stack.pop();
                if (!nodesVisited[inode]) {
                    nodesVisited[inode] = true;

                    for (let a in graph.successors) {
                        if (graph.getSuccessorsID(inode, a) != undefined) {
                            for (let inode2 of graph.getSuccessorsID(inode, a)) {
                                stack.push(inode2);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @returns the number of nodes in the graph
     * */
    getNodesNumber(): number {
        let c = 0;
        for (let o in this.nodes) {
            c++;
        }
        return c;
    }

    /**
     * @param node, a node identifier
     * @param agent, an agent (label)
     * @returns an array of all successors of node via the agent
     * */
    getSuccessorsID(node, agent): string[] {
        if (this.nodes[node] == undefined) {
            throw new Error('getSuccessors : There is no source node of ID ' + node);
        }
        if (this.successors[agent] == undefined) {
            return [];
        } else if (this.successors[agent][node] == undefined) {
            return [];
        } else {
            return this.successors[agent][node];
        }
    }

    /**
     @param agent
     @result true iff the relation for agent is reflexive (there is a self-loop over all nodes)
     */
    isReflexive(agent: string): boolean {
        for (let inode in this.nodes) {
            if (!this.isEdge(agent, inode, inode)) {
                return false;
            }
        }
        return true;
    }

    /**
     @returns a string that represents the graph in the DOT format (for graphviz)
     */
    getDOTNotation(): string {
        let graphDOTnotation = 'digraph G {\n     node ' + this.dotstyle + '\n';

        for (let i in this.nodes) {
            graphDOTnotation += '"' + i + '" [label="' + this.nodes[i] + '"]\n';
        }

        let T = [];

        for (let a in this.successors) {
            for (let i in this.successors[a]) {
                if (T[i] == undefined) {
                    T[i] = [];
                }

                for (let j in this.successors[a][i]) {
                    if (i != this.successors[a][i][j]) {
                        let succ = this.successors[a][i][j];
                        if (T[i][succ] == undefined) {
                            T[i][succ] = [];
                        }

                        T[i][succ].push(a);
                    }
                }
            }
        }

        let arrayIsEqual = function (array, testArr) {
            if (array.length != testArr.length) {
                return false;
            }
            for (let i = 0; i < testArr.length; i++) {
                if (array[i].compare) {
                    if (!array[i].compare(testArr[i])) {
                        return false;
                    }
                }
                if (array[i] !== testArr[i]) {
                    return false;
                }
            }
            return true;
        };

        for (let i in this.nodes) {
            for (let j in T[i]) {
                if (T[i][j] != undefined) {
                    let label = '';
                    // var comma = false;
                    for (let a in T[i][j]) {
                        /*if(comma)
                        label += "," + T[i][j][a];
                        else
                        {
                        label += T[i][j][a];
                        comma = true;
                        }*/
                        label += T[i][j][a];
                    }

                    let dirboth = '[';

                    if (j != i) {
                        if (T[j][i] != undefined) {
                            if (arrayIsEqual(T[i][j], T[j][i])) {
                                dirboth = '[dir=both, ';
                                T[j][i] = undefined;
                            }
                        }
                    }

                    graphDOTnotation += '"' + i + '" -> "' + j + '"' + dirboth + 'label="' + label + '"]\n';
                }
            }
        }

        graphDOTnotation += '}';

        return graphDOTnotation;
    }

    /**
     @param idnode is the ID of the node to be added
     @param content, an objet that is the node (for e.g. a valuation)
     @description Add a node of ID idnode and of content content
     @example G.addNode("w", new Valuation(["p"]))
     */
    addNode(idnode: string, content: T) {
        if (this.nodes[idnode] != undefined) {
            throw new Error('The structure already contains a node of ID ' + idnode);
        }

        this.nodes[idnode] = content;
    }

    /**
     @param idnode is the ID of the node to be added
     @returns the content of the node
     */
    getNode(idnode: string): T {
        return this.nodes[idnode];
    }

    hasNode(idnode: string): boolean {
        return idnode in this.nodes;
    }

    /**
     @param agent
     @param src ID of the source node
     @param dst ID of the destination node
     @pre we suppose that the edge (idsource agent iddestination) is not in the graph
     @description Add an edge from idsource to iddestination labelled by agent
     @example G.addEdge("a", "w", "u")
     */
    addEdge(agent: string, src: string, dst: string) {
        if (this.nodes[src] == undefined) {
            throw new Error('There is no source node of ID ' + src);
        }
        if (this.nodes[dst] == undefined) {
            throw new Error('There is no destination node of ID ' + dst);
        }

        if (this.successors[agent] == undefined) {
            this.successors[agent] = {};
        }

        if (this.successors[agent][src] == undefined) {
            this.successors[agent][src] = [];
        }

        if (this.successors[agent][src].indexOf(dst) < 0) {
            this.successors[agent][src].push(dst);
        }
    }

    addLoop(agent: string, idnode: string) {
        this.addEdge(agent, idnode, idnode);
    }

    /**
     @param agent
     @param idnodes array of node IDs
     @description Add edges between all nodes of ID in array
     @example G.addEdgesCluster("a", ["w", "u"])
     */
    addEdgesCluster(agent: string, idnodes: string[]) {
        for (let i1 of idnodes) {
            for (let i2 of idnodes) {
                this.addEdge(agent, i1, i2);
            }
        }
    }

    /**
     @param agent
     @param conditionFunction is a function that takes two content nodes and that returns true
     if, with respect to the contents the two nodes should be linked by an adge labelled by agent
     @description add edges labelled by agent with respect to the function conditionFunction
     @example G.addEdgeIf("a", function(n1, n2) {return n1.modelCheck("p") == n2.modelCheck("p");})
     */
    addEdgeIf(agent: string, conditionFunction: (n1: T, n2: T) => boolean) {
        for (let inode1 in this.nodes) {
            for (let inode2 in this.nodes) {
                if (conditionFunction(this.nodes[inode1], this.nodes[inode2])) {
                    this.addEdge(agent, inode1, inode2);
                }
            }
        }
    }

    /**
     @param functionToCall is a function of signature (agent, idsource, iddestination)
     @description This function calls functionToCall for all edges (agent, idsource, iddestination)
     */
    edgesForEach(functionToCall) {
        for (let agent in this.successors) {
            for (let nodeSourceID in this.nodes) {
                if (this.successors[agent] != undefined) {
                    if (this.successors[agent][nodeSourceID] != undefined) {
                        for (let nodeTargetID of this.successors[agent][nodeSourceID]) {
                            functionToCall(agent, nodeSourceID, nodeTargetID);
                        }
                    }
                }
            }
        }
    }

    /**
     @param agent
     @description The relation of agent becomes complete. That is, an edge labelled by agent
     is added between any pair of nodes
     @example G.makeCompleteRelation("a")
     */
    makeCompleteRelation(agent: string) {
        for (let i in this.nodes) {
            for (let j in this.nodes) {
                this.addEdge(agent, i, j);
            }
        }
    }

    /**
     @param agent
     @description The relation of agent becomes reflexive. That is, a reflexive edge labelled by agent
     is added on any node
     @example G.makeReflexiveRelation("a")
     */
    makeReflexiveRelation(agent: string) {
        for (let i in this.nodes) {
            this.addLoop(agent, i);
        }
    }

    /**
     @param agent
     @description The relation of agent becomes symmetric. That is, if w --a--> u exists,
     then u --a--> w is added
     @example G.makeSymmetricRelation("a")
     */
    makeSymmetricRelation(agent) {
        for (let i in this.nodes) {
            for (let j in this.nodes) {
                if (this.isEdge(agent, i, j)) {
                    this.addEdge(agent, j, i);
                }
            }
        }
    }

    /**
     @param agent
     @param src
     @param dst
     @returns true if there is an edge from idsource to iddestination  labelled by agent
     @example G.isEdge("a", "w", "u")
     */
    isEdge(agent: string, src: string, dst: string) {
        if (this.successors[agent] == undefined) {
            return false;
        }

        if (this.successors[agent][src] == undefined) {
            return false;
        }

        return this.successors[agent][src].indexOf(dst) >= 0;
    }

    dfs(sourceNode: string, maxDistance: number) {
        let visited = {};
        let queue = [];
        queue.push(sourceNode);
        visited[sourceNode] = { distance: 0, parent: null };

        while (queue.length != 0) {
            let world = queue.shift();
            for (let a of this.getAgents()) {
                for (let u of this.getSuccessorsID(world, a)) {
                    if (visited[u] == undefined) {
                        if (visited[world].distance >= maxDistance) {
                            return visited;
                        }

                        visited[u] = {
                            distance: visited[world].distance + 1,
                            parent: world,
                            agent: a
                        };
                        queue.push(u);
                    }
                }
            }
        }
        return visited;
    }

    pruneBehond(depth: number) {
        let visited = this.dfs(this.getPointedNode(), depth);
        this.removeUnvisitedNodes(visited);
    }

    getShortestPathVisited(src: string, dst: string) {
        let visited = {};
        let queue = [];
        queue.push(src);
        visited[src] = { distance: 0, parent: null };

        while (queue.length != 0) {
            let world = queue.shift();

            if (world == dst) {
                return visited;
            }
            for (let a of this.getAgents()) {
                for (let u of this.getSuccessorsID(world, a)) {
                    if (visited[u] == undefined) {
                        visited[u] = {
                            distance: visited[world].distance + 1,
                            parent: world,
                            agent: a
                        };
                        queue.push(u);
                    }
                }
            }
        }
        return undefined;
    }

    /**
     @param src ID of a source node
     @param dst ID of a destination node
     @returns a shortest path from sourceNode to destinationNode or undefined if
     no path exists.
     The is represented as follows:
     [{agent: a1, world: n1}, {agent: a1, world: n2}, ... {agent: ak, world: nk}]
     if the shortest path is
     sourceNode --a1--> n1 --a2--> n2 --.............. --ak--> nk = destinationNode
     @example G.getShortestPath("w", "u")
     **/
    getShortestPath(src: string, dst: string) {
        let visited = this.getShortestPathVisited(src, dst);

        if (visited == undefined) {
            return undefined;
        }

        let path = [];
        let world = dst;
        while (visited[world].parent != null) {
            path.unshift({ world, agent: visited[world].agent });
            world = visited[world].parent;
        }

        return path;
    }

    /**
     @param w ID of a node
     @example G.setPointedNode("w")
     **/
    setPointedNode(w: string) {
        if (this.nodes[w] == undefined) {
            throw new Error('the graph does not contain any node of ID ' + w);
        }
        this.pointed = w;
    }

    /**
     @returns the ID of the pointed node
     **/
    getPointedNode(): string {
        return this.pointed;
    }
}
