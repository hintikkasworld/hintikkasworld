import { Node } from '../../../services/models/node';
import { Edge } from '../../../services/models/edge';
import { Environment } from '../../../models/environment/environment';
import { Observable } from 'rxjs';
import { D3Service } from '../../../services/d3.service';
import { Component, Input, OnInit } from '@angular/core';
import { Graph } from '../../../services/models/graph';
import { ExplicitEpistemicModel } from '../../../models/epistemicmodel/explicit-epistemic-model';

@Component({
    selector: 'app-graph',
    templateUrl: './graph.component.html',
    styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {
    @Input() obsEnv: Observable<Environment>;
    nodes: Node[] = [];
    edges: Edge[] = [];

    graph: Graph;

    private readonly _options: { width; height } = { width: 500, height: 400 };

    constructor(private d3Service: D3Service) {}

    ngOnInit() {
        this.obsEnv.subscribe((env) => {
            if (env.getEpistemicModel() instanceof ExplicitEpistemicModel) {
                this.update(env.getEpistemicModel() as ExplicitEpistemicModel);
            }
        });
    }

    private update(M: ExplicitEpistemicModel) {
        let dictionnaryNode = {};

        this.nodes = [];
        for (let idnode in M.getNodes()) {
            dictionnaryNode[idnode] = new Node(idnode, M.getNode(idnode).toString());
            this.nodes.push(dictionnaryNode[idnode]);
        }

        this.edges = [];
        for (let agent of M.getAgents()) {
            for (let idnode in M.getNodes()) {
                for (let idnode2 of M.getSuccessorsID(idnode, agent)) {
                    this.edges.push(new Edge(dictionnaryNode[idnode], dictionnaryNode[idnode2], agent));
                }
            }
        }

        this.graph = this.d3Service.getGraph(this.nodes, this.edges, this.options);
    }

    ngAfterViewInit() {
        if (this.graph != undefined) {
            this.graph.initSimulation(this.options);
        }
    }

    getNodeById(id) {
        for (let node of this.nodes) {
            if (node.id == id) {
                return node;
            }
        }
        return null;
    }

    get options() {
        return this._options; /* = {
      width: window.innerWidth,
      height: window.innerHeight
    };*/
    }
}
