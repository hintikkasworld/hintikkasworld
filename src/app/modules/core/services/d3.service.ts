import * as d3 from 'd3';
import { Graph } from './models/graph';
import { Injectable } from '@angular/core';
import { Edge } from './models/edge';
import { Node } from './models/node';

@Injectable({
    providedIn: 'root'
})
export class D3Service {
    constructor() {}

    getGraph(nodes: Node[], edges: Edge[], options: { width; height }) {
        return new Graph(nodes, edges, options);
    }

    applyDraggableBehaviour(element, node: Node, graph: Graph) {
        const d3element = d3.select(element);

        function started() {
            /** Preventing propagation of dragstart to parent elements */
            d3.event.sourceEvent.stopPropagation();

            if (!d3.event.active) {
                graph.simulation.alphaTarget(0.3).restart();
            }

            d3.event.on('drag', dragged).on('end', ended);

            function dragged() {
                node.fx = d3.event.x;
                node.fy = d3.event.y;
            }

            function ended() {
                if (!d3.event.active) {
                    graph.simulation.alphaTarget(0);
                }

                node.fx = null;
                node.fy = null;
            }
        }

        d3element.call(d3.drag().on('start', started));
    }
}
