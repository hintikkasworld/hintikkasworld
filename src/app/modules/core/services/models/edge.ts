import { Node } from './node';
import * as d3 from 'd3';

export class Edge implements d3.SimulationLinkDatum<Node> {
    source: Node;    target: Node;
    index?: number;
    agent: string;

    constructor(source: Node, target: Node, agent: string) {
        this.source = source;
        this.target = target;
        this.agent = agent;
    }

}
