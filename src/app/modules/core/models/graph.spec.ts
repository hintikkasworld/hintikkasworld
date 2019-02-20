import { Graph } from './graph';

describe('Graph', () => {
  it('should create an instance', () => {
    expect(new Graph()).toBeTruthy();
  });

  it('agents should be empty if no node', () => {
    let G = new Graph();
    expect(G.getAgents().length == 0).toBeTruthy();
  });


  it('agents should be empty if no node', () => {
    let G = new Graph();
    G.addNode("w", {x: 0});
    G.addEdge("a", "w", "w");
    expect(G.getAgents().length == 1 && G.getAgents()[0] == "a").toBeTruthy();
  });
});
