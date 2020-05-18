import { Node } from './node';
import { EventEmitter } from '@angular/core';
import { Edge } from './edge';
import * as d3 from 'd3';

const FORCES = {
    EDGES: 1 / 20,
    COLLISION: 100,
    CHARGE: -300,
};

export class Graph {
    public ticker: EventEmitter<d3.Simulation<Node, Edge>> = new EventEmitter();
    public simulation: d3.Simulation<any, any>;
    public nodes: Node[] = [];
    public edges: Edge[] = [];
    options;

    constructor(nodes, edges, options: { width; height }) {
        this.nodes = nodes;
        this.edges = edges;
        this.options = options;
        this.initSimulation(options);
    }

    initSimulation(options: { width; height }) {
        if (!options || !options.width || !options.height) {
            throw new Error('missing options when initializing simulation');
        }
        /** Creating the simulation */
        if (!this.simulation) {
            const ticker = this.ticker;

            // Creating the force simulation and defining the charges
            this.simulation = d3.forceSimulation().force('charge', d3.forceManyBody().strength(FORCES.CHARGE));
            // Connecting the d3 ticker to an angular event emitter
            this.simulation.on('tick', function () {
                ticker.emit(this);
            });
            this.initNodes();
            this.initEdges();
        }
        /** Updating the central force of the simulation */
        this.simulation.force('center', d3.forceCenter(options.width / 2, options.height / 2));
        /** Restarting the simulation internal timer */
        this.simulation.restart();
    }

    initEdges(): void {
        if (!this.simulation) {
            throw new Error('simulation was not initialized yet');
        }
        this.simulation.force('edges', d3.forceLink(this.edges).strength(FORCES.EDGES));
    }

    initNodes(): void {
        if (!this.simulation) {
            throw new Error('simulation was not initialized yet');
        }
        this.simulation.nodes(this.nodes);
    }
}
